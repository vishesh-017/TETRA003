import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from "date-fns";

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

import { CAREGIVER_DEMO } from "./data";
import type {
  ActivityItem,
  AiCareInsight,
  CareAppointment,
  CareTimelineItem,
  CareVitalChip,
  DoctorMessage,
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
}

export interface CaregiverWorkspace {
  caregiverName: string;
  caregiverUserId: string;
  members: CaregiverWorkspaceMember[];
  education: typeof CAREGIVER_DEMO.education;
  emergency: typeof CAREGIVER_DEMO.emergency;
  source: "live" | "demo_fallback";
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
  if (!dob) return 60;
  const born = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) age -= 1;
  return Math.max(1, age);
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
      status:
        latest.bp_systolic == null ? "pending" : bpOk ? "ok" : "alert",
    },
    {
      label: "Sugar",
      status: sugarOk,
    },
  ];
}

function statusFromScore(
  score: number,
  alerts: SmartAlert[],
): FamilyMember["status"] {
  if (alerts.some((a) => a.priority === "critical")) return "critical";
  if (score < 70 || alerts.some((a) => a.priority === "high"))
    return "needs_attention";
  return "stable";
}

function buildTimeline(
  patientId: string,
  tasks: ReturnType<typeof getStore>["careTasks"],
  completions: ReturnType<typeof getStore>["taskCompletions"],
  latest: CheckInRow | undefined,
): CareTimelineItem[] {
  const today = todayKey();
  const active = tasks
    .filter((t) => t.patient_id === patientId && t.active)
    .slice(0, 6);
  if (!active.length) {
    return CAREGIVER_DEMO.timeline.ramesh ?? [];
  }
  const periodHour: Record<string, string> = {
    morning: "8:00 AM",
    afternoon: "2:00 PM",
    evening: "6:00 PM",
    night: "9:00 PM",
  };
  return active.map((task, i) => {
    const done = completions.find(
      (c) =>
        c.task_id === task.id &&
        c.date === today &&
        c.status === "completed",
    );
    let state: TimelineState = done ? "done" : "upcoming";
    if (!done && task.title.toLowerCase().includes("sugar") && !latest?.blood_sugar)
      state = "warning";
    if (!done && task.title.toLowerCase().includes("medicine") && i === 0)
      state = latest?.medicine_taken ? "done" : "warning";
    return {
      id: task.id,
      time: periodHour[task.period] ?? "—",
      title: task.title,
      detail: task.description || "Follow the care plan",
      state,
    };
  });
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
        name: med.name,
        dosage: med.dose || "As prescribed",
        instruction: med.instructions || med.frequency || "Follow label",
        slot: slotFromTime(slot),
        state,
        accent: accents[(mi + si) % accents.length]!,
      });
    });
  });
  return doses.length ? doses : (CAREGIVER_DEMO.medicines.ramesh ?? []);
}

function buildAlerts(
  patientId: string,
  latest: CheckInRow | undefined,
  adherence: number,
): SmartAlert[] {
  const storeAlerts = getStore()
    .alerts.filter((a) => a.patient_id === patientId)
    .slice(0, 6)
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
      detail: a.body,
      timeAgo: formatDistanceToNow(parseISO(a.created_at), { addSuffix: true }),
    }));

  const derived: SmartAlert[] = [];
  if (adherence < 70) {
    derived.push({
      id: `adh-${patientId}`,
      priority: "high",
      title: "Medicine adherence low",
      detail: `Today's adherence is about ${adherence}%. A gentle reminder helps.`,
      timeAgo: "Just now",
      actionLabel: "Remind them",
    });
  }
  if (latest?.blood_sugar != null && latest.blood_sugar >= 180) {
    derived.push({
      id: `sugar-${patientId}`,
      priority: latest.blood_sugar >= 250 ? "critical" : "high",
      title: "Blood sugar elevated",
      detail: `Latest reading ${latest.blood_sugar} mg/dL needs attention.`,
      timeAgo: formatDistanceToNow(parseISO(latest.recorded_at), {
        addSuffix: true,
      }),
      actionLabel: "Call doctor",
    });
  }
  if (latest?.bp_systolic != null && latest.bp_systolic >= 160) {
    derived.push({
      id: `bp-${patientId}`,
      priority: latest.bp_systolic >= 180 ? "critical" : "high",
      title: "Blood pressure high",
      detail: `Latest BP ${latest.bp_systolic}/${latest.bp_diastolic ?? "—"} mmHg.`,
      timeAgo: formatDistanceToNow(parseISO(latest.recorded_at), {
        addSuffix: true,
      }),
    });
  }

  const merged = [...derived, ...storeAlerts];
  return merged.length ? merged : (CAREGIVER_DEMO.alerts.ramesh ?? []).slice(0, 2);
}

function buildAppointments(patientId: string): CareAppointment[] {
  const upcoming = getStore()
    .appointments.filter(
      (a) =>
        a.patient_id === patientId &&
        (a.status === "scheduled" || a.status === "reschedule_requested"),
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const next = upcoming[0];
  if (!next) return [];
  const when = parseISO(next.scheduled_at);
  const whenLabel = isToday(when)
    ? "Today"
    : isTomorrow(when)
      ? "Tomorrow"
      : format(when, "EEE, d MMM");
  const doctor =
    getStore().profiles.find((p) => p.id === getStore().doctors[0]?.user_id)
      ?.full_name || "Dr. Mehta";
  return [
    {
      id: next.id,
      whenLabel,
      countdown: formatDistanceToNow(when, { addSuffix: true }),
      time: format(when, "h:mm a"),
      doctorName: doctor,
      specialty: getStore().doctors[0]?.specialty || "Follow-up",
      hospital: next.location || "Civil Hospital Ahmedabad",
      address: next.location || "Ahmedabad, Gujarat",
      mapQuery: next.location || "Civil Hospital Ahmedabad",
    },
  ];
}

function buildInsights(
  member: FamilyMember,
  latest: CheckInRow | undefined,
  adherence: number,
): HealthInsight[] {
  const insights: HealthInsight[] = [
    {
      id: "rec",
      title: `Recovery score is ${member.recoveryScore}`,
      why:
        member.status === "stable"
          ? "Daily tasks and medicines are keeping recovery on track."
          : "A few gaps today are pulling the score down — focus on pending items.",
      tone: member.status === "stable" ? "positive" : "attention",
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
  if (latest?.blood_sugar != null) {
    insights.push({
      id: "sugar",
      title:
        latest.blood_sugar < 180
          ? "Blood sugar is within a safer range"
          : "Blood sugar needs attention",
      why: `Latest glucose ${latest.blood_sugar} mg/dL.`,
      tone: latest.blood_sugar < 180 ? "positive" : "attention",
    });
  }
  return insights;
}

function buildActivity(patientId: string): ActivityItem[] {
  const store = getStore();
  const items: ActivityItem[] = [];
  for (const c of store.checkins
    .filter((x) => x.patient_id === patientId)
    .slice(0, 3)) {
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
    .slice(0, 3)) {
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
  return items.length
    ? items.slice(0, 6)
    : (CAREGIVER_DEMO.activity.ramesh ?? []).slice(0, 4);
}

function buildMemberFromStore(
  arrangement: CaregiverArrangementRow,
  patient: PatientRow,
  profile: ProfileRow,
): CaregiverWorkspaceMember {
  const store = getStore();
  const recovery =
    store.recoveryScores.find((r) => r.patient_id === patient.id)?.score ?? 75;
  const meds = store.medicines.filter(
    (m) => m.patient_id === patient.id && m.active,
  );
  const adherence = adherencePercent(patient.id, meds);
  const latest = store.checkins.find((c) => c.patient_id === patient.id);
  const alerts = arrangement.permissions.receive_alerts
    ? buildAlerts(patient.id, latest, adherence)
    : [];
  const status = statusFromScore(recovery, alerts);
  const tasks = store.careTasks.filter((t) => t.patient_id === patient.id);
  const completions = store.taskCompletions.filter(
    (c) => c.patient_id === patient.id,
  );
  const doneToday = completions.filter(
    (c) => c.date === todayKey() && c.status === "completed",
  ).length;
  const progress = tasks.length
    ? Math.round((doneToday / Math.max(1, tasks.length)) * 100)
    : Math.min(100, adherence);

  const appointments = arrangement.permissions.view_appointments
    ? buildAppointments(patient.id)
    : [];
  const nextAppt = appointments[0]?.whenLabel || "None scheduled";

  const member: FamilyMember = {
    id: patient.id,
    name: profile.full_name,
    relationship: arrangement.relationship,
    shortLabel: arrangement.relationship || profile.full_name.split(" ")[0] || "Family",
    age: ageFromDob(patient.date_of_birth),
    avatarEmoji: relationshipAvatar(arrangement.relationship, patient.sex),
    recoveryScore: recovery,
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
    trend:
      status === "stable"
        ? "improving"
        : status === "needs_attention"
          ? "declining"
          : "stable",
    trendLabel:
      status === "stable"
        ? "Improving"
        : status === "needs_attention"
          ? "Needs care"
          : "Watch closely",
    nextAppointment: nextAppt,
    bloodGroup: patient.blood_group || "—",
    allergies: patient.allergies.length ? patient.allergies : ["None recorded"],
    emergencyContact: {
      name: arrangement.caregiver_name,
      phone: arrangement.caregiver_phone,
      relationship: arrangement.relationship,
    },
    doctorName:
      store.profiles.find((p) => p.id === store.doctors[0]?.user_id)?.full_name ||
      "Dr. Mehta",
    hospital: store.doctors[0]?.hospital_affiliation || "Civil Hospital Ahmedabad",
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

  const passportRow = store.passports.find((p) => p.patient_id === patient.id);
  const passport: PassportPreviewData = {
    name: profile.full_name,
    bloodGroup: passportRow?.blood_group || patient.blood_group || "—",
    allergies: passportRow?.allergies?.length
      ? passportRow.allergies
      : patient.allergies.length
        ? patient.allergies
        : ["None recorded"],
    medicines: (
      passportRow?.current_medicines?.map((m) => `${m.name} ${m.dose || ""}`) ||
      meds.map((m) => `${m.name} ${m.dose || ""}`)
    ).slice(0, 4),
    emergencyContact: arrangement.caregiver_name,
    emergencyPhone: arrangement.caregiver_phone,
    qrValue: passportRow?.qr_token || `HN-${patient.id.slice(0, 8)}`,
    abhaId: passportRow?.abha_id_demo || patient.abha_id_demo || "—",
  };

  const insights = buildInsights(member, latest, adherence);
  const aiInsight: AiCareInsight = {
    summary:
      status === "stable"
        ? `${member.name.split(" ")[0]}'s recovery looks steady. Keep the current medicine and walk routine.`
        : `${member.name.split(" ")[0]} needs closer support today — review alerts before evening.`,
    bullets: insights.slice(0, 3).map((i) => i.title),
  };

  return {
    arrangement,
    member,
    timeline: buildTimeline(patient.id, tasks, completions, latest),
    insights,
    doctorMessages: [
      {
        id: `dm-${patient.id}`,
        doctorName: member.doctorName,
        specialty: store.doctors[0]?.specialty || "Care team",
        sentAt: "Care plan note",
        paragraphs: [
          store.carePlans.find((c) => c.patient_id === patient.id)
            ?.caregiver_instructions ||
            "Support medicine adherence and daily check-ins.",
          "AI assists doctors. Doctors make final decisions.",
        ],
      },
    ],
    alerts,
    medicines: arrangement.permissions.view_medicines
      ? buildMedicines(patient.id, meds)
      : [],
    appointments,
    passport,
    aiInsight,
    activity: buildActivity(patient.id),
    permissions: arrangement.permissions,
  };
}

function demoFallbackWorkspace(caregiverUserId: string): CaregiverWorkspace {
  return {
    caregiverName: caregiverFirst(CAREGIVER_DEMO.caregiverName),
    caregiverUserId,
    source: "demo_fallback",
    education: CAREGIVER_DEMO.education,
    emergency: CAREGIVER_DEMO.emergency,
    members: CAREGIVER_DEMO.family.map((member) => ({
      arrangement: {
        id: `demo-${member.id}`,
        patient_id: member.id,
        caregiver_user_id: caregiverUserId,
        caregiver_name: "Priya Patel",
        caregiver_phone: "+91-9876588888",
        caregiver_email: "caregiver@healnexus.demo",
        relationship: member.relationship,
        permissions: {
          view_medicines: true,
          view_vitals: true,
          view_appointments: true,
          receive_alerts: true,
          emergency_access: true,
        },
        status: "active" as const,
        invite_code: "DEMO",
        is_primary: member.id === CAREGIVER_DEMO.family[0]?.id,
        created_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
      },
      member,
      timeline: CAREGIVER_DEMO.timeline[member.id] ?? [],
      insights: CAREGIVER_DEMO.insights[member.id] ?? [],
      doctorMessages: CAREGIVER_DEMO.doctorMessages[member.id] ?? [],
      alerts: CAREGIVER_DEMO.alerts[member.id] ?? [],
      medicines: CAREGIVER_DEMO.medicines[member.id] ?? [],
      appointments: CAREGIVER_DEMO.appointments[member.id] ?? [],
      passport: CAREGIVER_DEMO.passports[member.id]!,
      aiInsight: CAREGIVER_DEMO.aiInsights[member.id]!,
      activity: CAREGIVER_DEMO.activity[member.id] ?? [],
      permissions: {
        view_medicines: true,
        view_vitals: true,
        view_appointments: true,
        receive_alerts: true,
        emergency_access: true,
      },
    })),
  };
}

function caregiverFirst(name: string) {
  return name.split(" ")[0] || name;
}

export function buildCaregiverWorkspace(caregiverUserId: string): CaregiverWorkspace {
  const store = getStore();
  const profile = store.profiles.find((p) => p.id === caregiverUserId);
  const arrangements = store.caregiverArrangements.filter(
    (a) =>
      a.caregiver_user_id === caregiverUserId &&
      (a.status === "active" || a.status === "invited"),
  );

  if (!arrangements.length) {
    return demoFallbackWorkspace(caregiverUserId);
  }

  const members: CaregiverWorkspaceMember[] = [];
  for (const arrangement of arrangements) {
    const patient = store.patients.find((p) => p.id === arrangement.patient_id);
    const patientProfile = patient
      ? store.profiles.find((p) => p.id === patient.user_id)
      : undefined;
    if (!patient || !patientProfile) continue;
    members.push(buildMemberFromStore(arrangement, patient, patientProfile));
  }

  if (!members.length) {
    return demoFallbackWorkspace(caregiverUserId);
  }

  return {
    caregiverName: caregiverFirst(profile?.full_name || "Caregiver"),
    caregiverUserId,
    members,
    education: CAREGIVER_DEMO.education,
    emergency: CAREGIVER_DEMO.emergency,
    source: "live",
  };
}

export function findArrangementByInviteCode(code: string) {
  const normalized = code.trim().toUpperCase();
  return getStore().caregiverArrangements.find(
    (a) =>
      a.invite_code.toUpperCase() === normalized && a.status !== "revoked",
  );
}
