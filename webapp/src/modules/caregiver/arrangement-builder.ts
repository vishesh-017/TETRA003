import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";

import { AHMEDABAD_DEMO_HOSPITALS } from "@/data/ahmedabad-hospitals";
import {
  getStore,
  todayKey,
  type CaregiverArrangementRow,
  type CaregiverPermissions,
  type CheckInRow,
  type MedicineRow,
  type PatientRow,
  type ProfileRow,
} from "@/data/store";
import { evaluateHealth } from "@/lib/health-engine";
import { instructionsToList } from "@/modules/doctor/care-companion-integration";
import { identityRepository } from "@/modules/identity/repository";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";

import type {
  ActivityItem,
  AiCareInsight,
  CareAppointment,
  CaregiverCarePlanSupport,
  CaregiverEmergencyContacts,
  CareTimelineItem,
  CareVitalChip,
  DoctorMessage,
  EducationTip,
  FamilyHealthSummary,
  FamilyMember,
  HealthInsight,
  MedicineDose,
  MedicineSlot,
  MedicineState,
  PassportPreviewData,
  SmartAlert,
  TimelineState,
} from "./types";

export interface CaregiverWorkspaceMember {
  arrangement: CaregiverArrangementRow;
  member: FamilyMember;
  timeline: CareTimelineItem[];
  insights: HealthInsight[];
  doctorMessages: DoctorMessage[];
  alerts: SmartAlert[];
  medicines: MedicineDose[];
  appointments: CareAppointment[];
  passport: PassportPreviewData;
  aiInsight: AiCareInsight;
  activity: ActivityItem[];
  permissions: CaregiverPermissions;
  carePlan: CaregiverCarePlanSupport | null;
  education: EducationTip[];
  emergency: CaregiverEmergencyContacts;
  trendSeries: Array<{ day: string; score: number }>;
}

export interface CaregiverWorkspace {
  caregiverName: string;
  caregiverUserId: string;
  members: CaregiverWorkspaceMember[];
  education: EducationTip[];
  emergency: CaregiverEmergencyContacts;
  familySummary: FamilyHealthSummary;
  source: "live" | "empty";
}

const AVATARS = ["👨", "👵", "👩", "👴", "🧑", "👤"];

function relationshipAvatar(relationship: string, sex: string | null): string {
  const r = relationship.toLowerCase();
  if (r.includes("father") || r.includes("dad")) return "👨";
  if (r.includes("mother") || r.includes("mom")) return "👵";
  if (r.includes("grandmother") || r.includes("nani") || r.includes("dadi"))
    return "👵";
  if (r.includes("grandfather") || r.includes("nana") || r.includes("dada"))
    return "👴";
  if (sex === "female") return "👩";
  if (sex === "male") return "👨";
  return AVATARS[Math.abs(relationship.length) % AVATARS.length]!;
}

function ageFromDob(dob: string | null): number {
  if (!dob) return 0;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return Math.max(0, age);
}

function slotFromTime(time: string): MedicineSlot {
  const hour = Number(time.split(":")[0] ?? 8);
  if (hour < 12) return "morning";
  if (hour < 16) return "afternoon";
  if (hour < 21) return "evening";
  return "night";
}

function adherencePercent(patientId: string, meds: MedicineRow[]): number {
  if (!meds.length) return 100;
  const today = todayKey();
  const events = getStore().medicineEvents.filter(
    (e) => e.patient_id === patientId && e.date === today,
  );
  let taken = 0;
  let total = 0;
  for (const med of meds) {
    const slots = med.time_slots.length || 1;
    total += slots;
    const medEvents = events.filter((e) => e.medicine_id === med.id);
    taken += medEvents.filter((e) => e.status === "taken").length;
  }
  if (!total) return 100;
  return Math.round((taken / total) * 100);
}

function vitalChips(latest: CheckInRow | undefined, adherence: number): CareVitalChip[] {
  const medicine: CareVitalChip = {
    label: "Medicine",
    status: adherence >= 80 ? "ok" : adherence >= 50 ? "pending" : "alert",
  };
  if (!latest) {
    return [
      medicine,
      { label: "BP", status: "pending" },
      { label: "Sugar", status: "pending" },
      { label: "Check-in", status: "pending" },
    ];
  }
  const bpOk =
    latest.bp_systolic != null &&
    latest.bp_systolic < 140 &&
    (latest.bp_diastolic == null || latest.bp_diastolic < 90);
  const sugarOk =
    latest.blood_sugar == null
      ? "pending"
      : latest.blood_sugar < 180
        ? "ok"
        : "alert";
  return [
    medicine,
    {
      label: "BP",
      status: latest.bp_systolic == null ? "pending" : bpOk ? "ok" : "alert",
    },
    { label: "Sugar", status: sugarOk },
    { label: "Check-in", status: "ok" },
  ];
}

function statusFromScore(
  score: number,
  alerts: SmartAlert[],
  riskLevel: string,
): FamilyMember["status"] {
  if (alerts.some((a) => a.priority === "critical") || riskLevel === "critical")
    return "critical";
  if (
    score < 70 ||
    alerts.some((a) => a.priority === "high") ||
    riskLevel === "high"
  )
    return "needs_attention";
  return "stable";
}

function doctorForPatient(patientId: string) {
  const store = getStore();
  const relation = store.relationships.find(
    (r) => r.patient_id === patientId && r.status === "active",
  );
  const doctor =
    store.doctors.find((d) => d.id === relation?.doctor_id) || store.doctors[0];
  const profile = doctor
    ? store.profiles.find((p) => p.id === doctor.user_id)
    : undefined;
  return { doctor, profile };
}

function buildTimeline(
  patientId: string,
  carePlanId: string | null,
  tasks: ReturnType<typeof getStore>["careTasks"],
  completions: ReturnType<typeof getStore>["taskCompletions"],
  latest: CheckInRow | undefined,
  appointments: CareAppointment[],
): CareTimelineItem[] {
  const today = todayKey();
  const active = tasks
    .filter(
      (t) =>
        t.patient_id === patientId &&
        t.active &&
        (!carePlanId || t.care_plan_id === carePlanId),
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const periodHour: Record<string, string> = {
    morning: "8:00 AM",
    afternoon: "2:00 PM",
    evening: "6:00 PM",
    night: "9:00 PM",
  };

  const items: CareTimelineItem[] = active.map((task) => {
    const completion = completions.find(
      (c) => c.task_id === task.id && c.date === today,
    );
    let state: TimelineState = "upcoming";
    if (completion?.status === "completed") state = "done";
    else if (completion?.status === "skipped") state = "warning";
    else if (task.period === "morning" || task.period === "afternoon")
      state = "pending";
    return {
      id: task.id,
      time: periodHour[task.period] ?? "—",
      title: task.title,
      detail: task.description || "Follow the approved care plan",
      state,
    };
  });

  const checkedInToday = Boolean(
    latest && latest.recorded_at.slice(0, 10) === today,
  );
  items.push({
    id: `checkin-${patientId}`,
    time: "Anytime",
    title: "Daily health check-in",
    detail: checkedInToday
      ? "Check-in completed today"
      : "Patient has not checked in yet today",
    state: checkedInToday ? "done" : "warning",
  });

  if (appointments[0]?.whenLabel === "Today") {
    items.push({
      id: `appt-${appointments[0].id}`,
      time: appointments[0].time,
      title: "Clinic appointment",
      detail: `${appointments[0].doctorName} · ${appointments[0].hospital}`,
      state: "upcoming",
    });
  }

  return items;
}

function buildMedicines(patientId: string, meds: MedicineRow[]): MedicineDose[] {
  const today = todayKey();
  const events = getStore().medicineEvents.filter(
    (e) => e.patient_id === patientId && e.date === today,
  );
  const accents = ["#3B82F6", "#0D9488", "#F59E0B", "#64748B", "#EF4444"];
  const doses: MedicineDose[] = [];
  meds.forEach((med, mi) => {
    const slots = med.time_slots.length ? med.time_slots : ["08:00"];
    slots.forEach((slot, si) => {
      const ev = events.find(
        (e) =>
          e.medicine_id === med.id &&
          (e.scheduled_for === slot || !e.scheduled_for),
      );
      let state: MedicineState = "pending";
      if (ev?.status === "taken") state = "taken";
      else if (ev?.status === "skipped") state = "skipped";
      else if (ev?.status === "missed") state = "missed";
      doses.push({
        id: `${med.id}-${slot}`,
        medicineId: med.id,
        timeSlot: slot,
        name: med.name,
        dosage: med.dose || "As prescribed",
        instruction: med.instructions || med.frequency || "Follow label",
        slot: slotFromTime(slot),
        state,
        accent: accents[(mi + si) % accents.length]!,
      });
    });
  });
  return doses;
}

function buildAlerts(
  patientId: string,
  caregiverUserId: string,
  latest: CheckInRow | undefined,
  adherence: number,
): SmartAlert[] {
  const store = getStore();
  const storeAlerts = store.alerts
    .filter((a) => a.patient_id === patientId && a.status === "open")
    .slice(0, 8)
    .map((a) => ({
      id: a.id,
      priority:
        a.severity === "critical"
          ? ("critical" as const)
          : a.severity === "high"
            ? ("high" as const)
            : a.severity === "moderate"
              ? ("medium" as const)
              : ("low" as const),
      title: a.title,
      detail: a.body || a.reason,
      timeAgo: formatDistanceToNow(parseISO(a.created_at), { addSuffix: true }),
    }));

  const derived: SmartAlert[] = [];
  if (adherence < 70) {
    derived.push({
      id: `adh-${patientId}`,
      priority: "high",
      title: "Medicine missed / low adherence",
      detail: `Today's adherence is about ${adherence}%.`,
      timeAgo: "Today",
      actionLabel: "Remind them",
    });
  }
  if (latest?.blood_sugar != null && latest.blood_sugar >= 180) {
    derived.push({
      id: `sugar-${patientId}`,
      priority: latest.blood_sugar >= 250 ? "critical" : "high",
      title: "High sugar",
      detail: `Latest reading ${latest.blood_sugar} mg/dL.`,
      timeAgo: formatDistanceToNow(parseISO(latest.recorded_at), {
        addSuffix: true,
      }),
      actionLabel: "Call doctor",
    });
  }
  if (latest?.bp_systolic != null && latest.bp_systolic >= 140) {
    derived.push({
      id: `bp-${patientId}`,
      priority: latest.bp_systolic >= 180 ? "critical" : "high",
      title: "Abnormal BP",
      detail: `Latest BP ${latest.bp_systolic}/${latest.bp_diastolic ?? "—"} mmHg.`,
      timeAgo: formatDistanceToNow(parseISO(latest.recorded_at), {
        addSuffix: true,
      }),
    });
  }
  const today = todayKey();
  if (!latest || latest.recorded_at.slice(0, 10) !== today) {
    derived.push({
      id: `missed-checkin-${patientId}`,
      priority: "medium",
      title: "Check-in missed",
      detail: "No health check-in recorded today yet.",
      timeAgo: "Today",
    });
  }

  const noteAlerts = store.notifications
    .filter(
      (n) =>
        n.user_id === caregiverUserId &&
        (n.type === "doctor_message" ||
          n.type === "appointment" ||
          n.type === "emergency" ||
          n.type === "medicine") &&
        !n.read,
    )
    .slice(0, 4)
    .map((n) => ({
      id: `n-${n.id}`,
      priority:
        n.type === "emergency" ? ("critical" as const) : ("medium" as const),
      title: n.title,
      detail: n.body,
      timeAgo: formatDistanceToNow(parseISO(n.created_at), { addSuffix: true }),
    }));

  return [...derived, ...storeAlerts, ...noteAlerts];
}

function buildAppointments(patientId: string): CareAppointment[] {
  const store = getStore();
  const { doctor, profile } = doctorForPatient(patientId);
  const upcoming = store.appointments
    .filter(
      (a) =>
        a.patient_id === patientId &&
        (a.status === "scheduled" || a.status === "reschedule_requested"),
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));

  return upcoming.map((next) => {
    const when = parseISO(next.scheduled_at);
    const whenLabel = isToday(when)
      ? "Today"
      : isTomorrow(when)
        ? "Tomorrow"
        : format(when, "EEE, d MMM");
    return {
      id: next.id,
      whenLabel,
      countdown: formatDistanceToNow(when, { addSuffix: true }),
      time: format(when, "h:mm a"),
      doctorName: next.doctor_name || profile?.full_name || "Care team",
      specialty: doctor?.specialty || next.appointment_type || "Follow-up",
      hospital:
        next.location ||
        doctor?.hospital_affiliation ||
        AHMEDABAD_DEMO_HOSPITALS[0]?.name ||
        "Hospital",
      address: next.location || doctor?.hospital_affiliation || "Ahmedabad",
      mapQuery:
        next.location ||
        doctor?.hospital_affiliation ||
        AHMEDABAD_DEMO_HOSPITALS[0]?.name ||
        "Ahmedabad hospital",
    };
  });
}

function buildInsights(
  member: FamilyMember,
  latest: CheckInRow | undefined,
  adherence: number,
  healthSummary: string | null,
): HealthInsight[] {
  const insights: HealthInsight[] = [
    {
      id: "rec",
      title: `Recovery score is ${Math.round(member.recoveryScore)}`,
      why:
        healthSummary ||
        (member.status === "stable"
          ? "Daily tasks and medicines are keeping recovery on track."
          : "Gaps today are pulling the score down — focus on pending items."),
      tone: member.status === "stable" ? "positive" : "attention",
    },
    {
      id: "risk",
      title: `Readmission risk: ${member.riskLevel}`,
      why: `Disease progression outlook: ${member.progression}.`,
      tone:
        member.riskLevel === "low" || member.riskLevel === "moderate"
          ? "neutral"
          : "attention",
    },
    {
      id: "med",
      title:
        adherence >= 90
          ? "Medicine adherence is excellent"
          : adherence >= 70
            ? "Medicine adherence is fair"
            : "Medicine adherence needs attention",
      why: `${adherence}% of today's doses are confirmed taken.`,
      tone: adherence >= 90 ? "positive" : adherence >= 70 ? "neutral" : "attention",
    },
  ];
  if (latest?.symptoms?.length) {
    insights.push({
      id: "symptoms",
      title: "Recent symptoms logged",
      why: latest.symptoms.slice(0, 4).join(", "),
      tone: "attention",
    });
  }
  if (latest?.bp_systolic != null) {
    insights.push({
      id: "bp",
      title:
        latest.bp_systolic < 140
          ? "Blood pressure remained stable"
          : "Blood pressure needs monitoring",
      why: `Latest reading ${latest.bp_systolic}/${latest.bp_diastolic ?? "—"} mmHg.`,
      tone: latest.bp_systolic < 140 ? "positive" : "attention",
    });
  }
  return insights;
}

function buildActivity(patientId: string): ActivityItem[] {
  const store = getStore();
  const items: ActivityItem[] = [];
  for (const c of store.checkins
    .filter((x) => x.patient_id === patientId)
    .slice(0, 4)) {
    items.push({
      id: `c-${c.id}`,
      title: "Check-in logged",
      detail: [
        c.bp_systolic ? `BP ${c.bp_systolic}/${c.bp_diastolic}` : null,
        c.blood_sugar ? `Sugar ${c.blood_sugar}` : null,
        c.medicine_taken ? "Medicines taken" : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Vitals recorded",
      timestamp: format(parseISO(c.recorded_at), "h:mm a"),
      tone:
        (c.blood_sugar != null && c.blood_sugar >= 180) ||
        (c.bp_systolic != null && c.bp_systolic >= 160)
          ? "alert"
          : "ok",
    });
  }
  for (const e of store.medicineEvents
    .filter((x) => x.patient_id === patientId)
    .slice(0, 4)) {
    const med = store.medicines.find((m) => m.id === e.medicine_id);
    items.push({
      id: `m-${e.id}`,
      title:
        e.status === "taken"
          ? "Medicine completed"
          : e.status === "missed"
            ? "Medicine missed"
            : "Medicine skipped",
      detail: med?.name || "Dose update",
      timestamp: format(parseISO(e.acted_at), "h:mm a"),
      tone: e.status === "taken" ? "ok" : "alert",
    });
  }
  return items.slice(0, 8);
}

function localizeBundle(en: string): Record<"en" | "hi" | "gu" | "mr", string> {
  const map: Record<string, { hi: string; gu: string; mr: string }> = {
    "Today's care focus": {
      hi: "आज की देखभाल प्राथमिकता",
      gu: "આજની કાળજી ફોકસ",
      mr: "आजची काळजी प्राधान्य",
    },
    "Diet guidance": {
      hi: "आहार मार्गदर्शन",
      gu: "આહાર માર્ગદર્શન",
      mr: "आहार मार्गदर्शन",
    },
    "Exercise guidance": {
      hi: "व्यायाम मार्गदर्शन",
      gu: "કસરત માર્ગદર્શન",
      mr: "व्यायाम मार्गदर्शन",
    },
    "Warning signs": {
      hi: "चेतावनी संकेत",
      gu: "ચેતવણી સંકેતો",
      mr: "इशारे लक्ष द्या",
    },
    "Medicine support": {
      hi: "दवा सहायता",
      gu: "દવા સહાય",
      mr: "औषध सहाय्य",
    },
  };
  const hit = map[en];
  return {
    en,
    hi: hit?.hi ?? en,
    gu: hit?.gu ?? en,
    mr: hit?.mr ?? en,
  };
}

function tip(
  id: string,
  category: EducationTip["category"],
  categoryLabel: string,
  title: string,
  body: string,
): EducationTip {
  return {
    id,
    category,
    categoryLabel,
    title: localizeBundle(title),
    body: { en: body, hi: body, gu: body, mr: body },
  };
}

function buildEducation(
  carePlan: CaregiverCarePlanSupport | null,
  discharge: {
    diet_advice: string | null;
    exercise_advice: string | null;
  } | null,
): EducationTip[] {
  const tips: EducationTip[] = [];
  if (carePlan?.nextSteps?.length) {
    tips.push(
      tip(
        "today",
        "today",
        "Today",
        "Today's care focus",
        carePlan.nextSteps.slice(0, 3).join(" · "),
      ),
    );
  }
  if (discharge?.diet_advice) {
    tips.push(tip("diet", "diet", "Diet", "Diet guidance", discharge.diet_advice));
  }
  if (discharge?.exercise_advice) {
    tips.push(
      tip(
        "exercise",
        "exercise",
        "Activity",
        "Exercise guidance",
        discharge.exercise_advice,
      ),
    );
  }
  if (carePlan?.warningSigns?.length) {
    tips.push(
      tip(
        "emergency",
        "emergency",
        "Watch for",
        "Warning signs",
        carePlan.warningSigns.slice(0, 4).join(" · "),
      ),
    );
  }
  if (carePlan?.medicineTimeline?.length) {
    tips.push(
      tip(
        "medicine",
        "medicine",
        "Medicines",
        "Medicine support",
        "Help the patient take medicines exactly as written by the doctor.",
      ),
    );
  }
  return tips;
}

function buildEmergency(
  patientId: string,
  arrangement: CaregiverArrangementRow,
): CaregiverEmergencyContacts {
  const emergency = identityRepository.getEmergencyProfileByPatient(patientId);
  const hospital =
    AHMEDABAD_DEMO_HOSPITALS.find((h) => h.is_emergency) ||
    AHMEDABAD_DEMO_HOSPITALS[0]!;
  const doctorPhone = emergency.doctor?.phone
    ? `tel:${emergency.doctor.phone.replace(/\s/g, "")}`
    : "tel:108";
  const contactPhone =
    emergency.emergency_contact?.phone ||
    arrangement.caregiver_phone ||
    hospital.phone;

  const hospitalTel = (hospital.phone || "108").replace(/\s/g, "");
  return {
    doctorPhone,
    videoLink: "https://meet.google.com/new",
    emergencyPhone: `tel:${String(contactPhone).replace(/\s/g, "")}`,
    hospitalName: emergency.doctor?.hospital || hospital.name,
    hospitalPhone: `tel:${hospitalTel}`,
    ambulance: "tel:108",
  };
}

function buildDoctorMessages(
  caregiverUserId: string,
  member: FamilyMember,
  carePlan: CaregiverCarePlanSupport | null,
  specialty: string,
): DoctorMessage[] {
  const store = getStore();
  const fromNotes = store.notifications
    .filter(
      (n) => n.user_id === caregiverUserId && n.type === "doctor_message",
    )
    .slice(0, 5)
    .map((n) => ({
      id: n.id,
      doctorName: member.doctorName,
      specialty,
      sentAt: formatDistanceToNow(parseISO(n.created_at), { addSuffix: true }),
      paragraphs: [n.title, n.body].filter(Boolean),
    }));

  if (carePlan?.doctorNotes || carePlan?.instructions?.length) {
    fromNotes.unshift({
      id: `plan-${member.id}`,
      doctorName: member.doctorName,
      specialty,
      sentAt: "Approved care plan",
      paragraphs: [
        carePlan.doctorNotes || "Follow the approved recovery plan.",
        ...(carePlan.instructions.slice(0, 2) || []),
      ].filter(Boolean) as string[],
    });
  }

  return fromNotes;
}

function buildTrendSeries(patientId: string, currentScore: number) {
  const checkins = getStore()
    .checkins.filter((c) => c.patient_id === patientId)
    .slice(0, 7)
    .reverse();
  if (!checkins.length) {
    return [{ day: "Now", score: Math.round(currentScore) }];
  }
  return checkins.map((c, i) => ({
    day: format(parseISO(c.recorded_at), "EEE"),
    score: Math.max(
      20,
      Math.min(
        100,
        Math.round(
          currentScore -
            (checkins.length - 1 - i) * 2 +
            (c.medicine_taken ? 2 : -3) +
            (c.pain_score != null ? -c.pain_score : 0),
        ),
      ),
    ),
  }));
}

function buildMemberFromStore(
  arrangement: CaregiverArrangementRow,
  patient: PatientRow,
  profile: ProfileRow,
  caregiverUserId: string,
): CaregiverWorkspaceMember {
  const store = getStore();
  const obs = buildObservationsForPatient(patient.id);
  const health = evaluateHealth(obs);
  const recovery = Math.round(health.recovery.recovery_score);
  const riskLevel = health.readmission.risk_category;
  const progression = health.progression.overall_worsening_risk;

  const meds = store.medicines.filter(
    (m) => m.patient_id === patient.id && m.active,
  );
  const adherence = adherencePercent(patient.id, meds);
  const latest = store.checkins.find((c) => c.patient_id === patient.id);
  const alerts = arrangement.permissions.receive_alerts
    ? buildAlerts(patient.id, caregiverUserId, latest, adherence)
    : [];
  const status = statusFromScore(recovery, alerts, riskLevel);

  const activePlan = store.carePlans.find(
    (c) => c.patient_id === patient.id && c.status === "active",
  );
  const tasks = store.careTasks.filter((t) => t.patient_id === patient.id);
  const completions = store.taskCompletions.filter(
    (c) => c.patient_id === patient.id,
  );
  const activeTasks = tasks.filter(
    (t) =>
      t.active && (!activePlan || t.care_plan_id === activePlan.id),
  );
  const doneToday = completions.filter(
    (c) =>
      c.date === todayKey() &&
      c.status === "completed" &&
      activeTasks.some((t) => t.id === c.task_id),
  ).length;
  const progress = activeTasks.length
    ? Math.round((doneToday / Math.max(1, activeTasks.length)) * 100)
    : Math.min(100, adherence);

  const appointments = arrangement.permissions.view_appointments
    ? buildAppointments(patient.id)
    : [];
  const { doctor, profile: doctorProfile } = doctorForPatient(patient.id);
  const doctorName = doctorProfile?.full_name || "Care team";
  const hospital =
    doctor?.hospital_affiliation ||
    AHMEDABAD_DEMO_HOSPITALS[0]?.name ||
    "Hospital";

  const patientEmergency = patient.emergency_contact;

  const member: FamilyMember = {
    id: patient.id,
    userId: patient.user_id,
    name: profile.full_name,
    relationship: arrangement.relationship,
    shortLabel:
      arrangement.relationship || profile.full_name.split(" ")[0] || "Family",
    age: ageFromDob(patient.date_of_birth),
    avatarEmoji: relationshipAvatar(arrangement.relationship, patient.sex),
    recoveryScore: recovery,
    riskLevel,
    progression,
    status,
    statusLabel:
      status === "stable"
        ? "Stable"
        : status === "needs_attention"
          ? "Needs Attention"
          : "Critical",
    todayProgress: progress,
    vitals: arrangement.permissions.view_vitals
      ? vitalChips(latest, adherence)
      : [],
    medicineAdherence: adherence,
    trend: health.trends.trends.some((t) => t.clinical_trend === "declining")
      ? "declining"
      : health.trends.trends.some((t) => t.clinical_trend === "improving")
        ? "improving"
        : "stable",
    trendLabel: health.trends.narrative_summary || "Monitoring",
    nextAppointment: appointments[0]?.whenLabel || "None scheduled",
    bloodGroup: patient.blood_group || "—",
    allergies: patient.allergies.length ? patient.allergies : ["None recorded"],
    emergencyContact: {
      name:
        patientEmergency?.name ||
        arrangement.caregiver_name ||
        "Emergency contact",
      phone:
        patientEmergency?.phone || arrangement.caregiver_phone || "108",
      relationship:
        patientEmergency?.relationship || arrangement.relationship || "Caregiver",
    },
    doctorName,
    hospital,
    conditionSummary:
      patient.chronic_diseases.join(" · ") ||
      patient.medical_history ||
      "Post-discharge recovery",
    pmjayStatus:
      store.governmentProfiles.find((g) => g.patient_id === patient.id)
        ?.pmjay_status === "likely_eligible"
        ? "Active · Likely eligible"
        : "Review pending",
    abhaId: patient.abha_id_demo || "—",
  };

  const digital = identityRepository.getDigitalPassport(patient.id);
  const passport: PassportPreviewData = digital
    ? {
        name: digital.full_name,
        bloodGroup: digital.blood_group || "—",
        allergies: digital.allergies.length
          ? digital.allergies
          : ["None recorded"],
        medicines: digital.medicines
          .map((m) => `${m.name} ${m.dose || ""}`.trim())
          .slice(0, 6),
        emergencyContact:
          digital.emergency_contact?.name || member.emergencyContact.name,
        emergencyPhone:
          digital.emergency_contact?.phone || member.emergencyContact.phone,
        qrValue: digital.qr_token,
        abhaId: digital.abha_id_demo || member.abhaId,
      }
    : {
        name: profile.full_name,
        bloodGroup: patient.blood_group || "—",
        allergies: member.allergies,
        medicines: meds.map((m) => `${m.name} ${m.dose || ""}`.trim()),
        emergencyContact: member.emergencyContact.name,
        emergencyPhone: member.emergencyContact.phone,
        qrValue: `HN-${patient.id.slice(0, 8)}`,
        abhaId: member.abhaId,
      };

  const discharge = activePlan?.discharge_id
    ? store.discharges.find((d) => d.id === activePlan.discharge_id)
    : store.discharges
        .filter((d) => d.patient_id === patient.id && d.status === "finalized")
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const carePlan: CaregiverCarePlanSupport | null = activePlan
    ? {
        version: activePlan.version,
        instructions: instructionsToList(activePlan.caregiver_instructions),
        warningSigns: activePlan.warning_signs || [],
        emergencyAdvice:
          "For chest pain, severe breathlessness, confusion, or fainting — call emergency services and the care team immediately.",
        medicineTimeline: meds.map((m) =>
          [m.name, m.dose, m.frequency, m.time_slots.join(", ")]
            .filter(Boolean)
            .join(" · "),
        ),
        doctorNotes: discharge?.doctor_notes || activePlan.ai_summary,
        upcomingAppointment: appointments[0]
          ? `${appointments[0].whenLabel} · ${appointments[0].hospital}`
          : discharge?.follow_up_date
            ? `Follow-up ${discharge.follow_up_date}`
            : null,
        nextSteps: activePlan.next_steps || [],
        patientSummary: activePlan.patient_friendly_instructions,
      }
    : null;

  const education = buildEducation(carePlan, discharge || null);
  const emergency = buildEmergency(patient.id, arrangement);
  const insights = buildInsights(
    member,
    latest,
    adherence,
    health.recovery.summary || health.explain.why.title,
  );
  const doctorMessages = buildDoctorMessages(
    caregiverUserId,
    member,
    carePlan,
    doctor?.specialty || "Care team",
  );

  const aiInsight: AiCareInsight = {
    summary:
      carePlan?.patientSummary ||
      health.recovery.summary ||
      `${member.name.split(" ")[0]}'s live recovery signals are updating from check-ins and medicines.`,
    bullets: [
      ...(carePlan?.warningSigns?.slice(0, 2) || []),
      ...health.explain.why.bullets.slice(0, 2),
      ...insights.slice(0, 2).map((i) => i.title),
    ].slice(0, 4),
  };

  return {
    arrangement,
    member,
    timeline: buildTimeline(
      patient.id,
      activePlan?.id ?? null,
      tasks,
      completions,
      latest,
      appointments,
    ),
    insights,
    doctorMessages,
    alerts,
    medicines: arrangement.permissions.view_medicines
      ? buildMedicines(patient.id, meds)
      : [],
    appointments,
    passport,
    aiInsight,
    activity: buildActivity(patient.id),
    permissions: arrangement.permissions,
    carePlan,
    education,
    emergency,
    trendSeries: buildTrendSeries(patient.id, recovery),
  };
}

function caregiverFirst(name: string) {
  return name.split(" ")[0] || name;
}

function emptyEmergency(): CaregiverEmergencyContacts {
  const hospital =
    AHMEDABAD_DEMO_HOSPITALS.find((h) => h.is_emergency) ||
    AHMEDABAD_DEMO_HOSPITALS[0]!;
  return {
    doctorPhone: "tel:108",
    videoLink: "https://meet.google.com/new",
    emergencyPhone: "tel:108",
    hospitalName: hospital.name,
    hospitalPhone: `tel:${(hospital.phone || "108").replace(/\s/g, "")}`,
    ambulance: "tel:108",
  };
}

function summarizeFamily(members: CaregiverWorkspaceMember[]): FamilyHealthSummary {
  if (!members.length) {
    return {
      memberCount: 0,
      overallWellness: 0,
      attentionCount: 0,
      upcomingAppointments: 0,
      criticalAlerts: 0,
    };
  }
  const overallWellness = Math.round(
    members.reduce((sum, m) => sum + m.member.recoveryScore, 0) / members.length,
  );
  return {
    memberCount: members.length,
    overallWellness,
    attentionCount: members.filter((m) => m.member.status !== "stable").length,
    upcomingAppointments: members.reduce(
      (sum, m) => sum + m.appointments.length,
      0,
    ),
    criticalAlerts: members.reduce(
      (sum, m) =>
        sum + m.alerts.filter((a) => a.priority === "critical").length,
      0,
    ),
  };
}

export function buildCaregiverWorkspace(caregiverUserId: string): CaregiverWorkspace {
  const store = getStore();
  const profile = store.profiles.find((p) => p.id === caregiverUserId);
  const arrangements = store.caregiverArrangements.filter(
    (a) =>
      a.caregiver_user_id === caregiverUserId &&
      (a.status === "active" || a.status === "invited"),
  );

  const members: CaregiverWorkspaceMember[] = [];
  for (const arrangement of arrangements) {
    const patient = store.patients.find((p) => p.id === arrangement.patient_id);
    const patientProfile = patient
      ? store.profiles.find((p) => p.id === patient.user_id)
      : undefined;
    if (!patient || !patientProfile) continue;
    members.push(
      buildMemberFromStore(
        arrangement,
        patient,
        patientProfile,
        caregiverUserId,
      ),
    );
  }

  members.sort((a, b) => {
    const rank = { critical: 0, needs_attention: 1, stable: 2 };
    return rank[a.member.status] - rank[b.member.status];
  });

  const primary = members[0];
  return {
    caregiverName: caregiverFirst(profile?.full_name || "Caregiver"),
    caregiverUserId,
    members,
    education: primary?.education || [],
    emergency: primary?.emergency || emptyEmergency(),
    familySummary: summarizeFamily(members),
    source: members.length ? "live" : "empty",
  };
}

export function findArrangementByInviteCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return getStore().caregiverArrangements.find(
    (a) =>
      a.invite_code.toUpperCase() === normalized && a.status !== "revoked",
  );
}
