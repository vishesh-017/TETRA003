import {
  getStore,
  IDS,
  subscribeStore,
  todayKey,
} from "@/data/store";
import { evaluateHealth, type RiskCategory } from "@/lib/health-engine";
import { doctorRepository } from "@/modules/doctor/repository";
import type {
  AiInsightCard,
  AiPatientSummaryView,
  CohortTrendPoint,
  IntelligenceAlert,
  IntelligenceBundle,
  IntelligenceFilters,
  IntelligenceSummary,
  PriorityPatientCard,
  SuggestedAction,
} from "@/modules/doctor/intelligence/types";
import type { RiskLevel } from "@/modules/doctor/types";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";
import { countPendingSync } from "@/modules/rural/offline/storage";

function mapRisk(category: RiskCategory): RiskLevel {
  if (category === "medium") return "moderate";
  return category;
}

function riskRank(level: RiskLevel | string | null | undefined): number {
  const order = ["low", "moderate", "medium", "high", "critical"];
  return order.indexOf(level || "low");
}

function suggestAction(
  risk: RiskLevel,
  recovery: number,
  emergency: boolean,
): SuggestedAction {
  if (emergency || risk === "critical" || recovery < 40) return "immediate_review";
  if (risk === "high" || recovery < 60) return "schedule_followup";
  return "monitor";
}

function adherenceFor(patientId: string): number {
  const store = getStore();
  const meds = store.medicines.filter((m) => m.patient_id === patientId && m.active);
  if (!meds.length) return 72;
  const today = todayKey();
  const events = store.medicineEvents.filter(
    (e) => e.patient_id === patientId && e.date === today,
  );
  if (!events.length) {
    // Use seed recovery proxy
    return Math.min(
      100,
      Math.max(40, (store.recoveryScores.find((r) => r.patient_id === patientId)?.score ?? 70) - 8),
    );
  }
  const taken = events.filter((e) => e.status === "taken").length;
  return Math.round((taken / Math.max(events.length, 1)) * 100);
}

function lastCheckin(patientId: string): string | null {
  const rows = getStore()
    .checkins.filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  return rows[0]?.recorded_at ?? null;
}

function nextAppointment(patientId: string, doctorId: string): string | null {
  const now = Date.now();
  const row = getStore()
    .appointments.filter(
      (a) =>
        a.patient_id === patientId &&
        a.doctor_id === doctorId &&
        a.status === "scheduled" &&
        new Date(a.scheduled_at).getTime() >= now,
    )
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0];
  return row?.scheduled_at ?? null;
}

function buildInsight(
  name: string,
  recovery: number,
  adherence: number,
  sugarRising: boolean,
  missedCheckins: boolean,
  emergency: boolean,
): string {
  if (emergency) return `${name}: emergency-range vitals or red-flag symptoms reported.`;
  if (adherence < 70)
    return `Recovery score pressure from missed medicines (adherence ≈ ${adherence}%).`;
  if (sugarRising) return "Blood sugar has increased across recent readings.";
  if (missedCheckins) return "Patient has not completed daily check-ins consistently.";
  if (recovery < 60) return `Recovery score is ${recovery.toFixed(0)}/100 — needs closer review.`;
  return "Signals are relatively stable; continue monitoring per care plan.";
}

function ensureDoctorUser(userId: string) {
  const store = getStore();
  return (
    store.doctors.find((d) => d.user_id === userId) ||
    store.doctors.find((d) => d.id === IDS.doctor)!
  );
}

export const intelligenceRepository = {
  subscribe(listener: () => void) {
    return subscribeStore(listener);
  },

  getBundle(userId: string, filters?: Partial<IntelligenceFilters>): IntelligenceBundle {
    const doctor = ensureDoctorUser(userId);
    const store = getStore();
    const today = todayKey();
    const patients = doctorRepository.listPatients(userId);
    const ids = patients.map((p) => p.id);

    let missedCheckins = 0;
    const priority_queue: PriorityPatientCard[] = [];
    const insights: AiInsightCard[] = [];

    for (const p of patients) {
      const health = evaluateHealth(buildObservationsForPatient(p.id));
      const adherence = adherenceFor(p.id);
      const last = lastCheckin(p.id);
      const missed = !last || last.slice(0, 10) < today;
      if (missed) missedCheckins += 1;

      const sugar = health.trends.trends.find((t) => t.metric === "blood_sugar");
      const sugarRising = sugar?.clinical_trend === "declining"; // rising sugar = declining clinical
      const emergency =
        health.alerts.action === "emergency" ||
        health.alerts.action === "immediate_attention";
      const risk = mapRisk(health.readmission.risk_category);
      const action = suggestAction(risk, health.recovery.recovery_score, emergency);
      const insight = buildInsight(
        p.full_name,
        health.recovery.recovery_score,
        adherence,
        sugarRising,
        missed,
        emergency,
      );

      const hwAssign = (store.healthWorkerAssignments ?? []).find(
        (a) => a.patient_id === p.id,
      );
      const hw = hwAssign
        ? store.profiles.find(
            (pr) =>
              pr.id ===
              store.healthWorkers?.find((h) => h.id === hwAssign.health_worker_id)
                ?.user_id,
          )?.full_name
        : null;

      const patient = store.patients.find((x) => x.id === p.id);
      const caregiver = patient?.caregiver_info?.name ?? null;

      const priority =
        riskRank(risk) * 40 +
        (emergency ? 50 : 0) +
        (100 - health.recovery.recovery_score) * 0.5 +
        (adherence < 70 ? 15 : 0) +
        (missed ? 10 : 0);

      priority_queue.push({
        patient_id: p.id,
        full_name: p.full_name,
        age: p.age ?? null,
        phone: p.phone ?? null,
        abha_id: p.abha_id_demo ?? null,
        conditions: p.chronic_diseases || [],
        recovery_score: health.recovery.recovery_score,
        recovery_level: health.recovery.recovery_level,
        readmission_risk: risk,
        disease_progression: health.progression.overall_worsening_risk,
        medicine_adherence: adherence,
        last_checkin_at: last,
        next_appointment_at: nextAppointment(p.id, doctor.id),
        priority_score: priority,
        risk_badge: risk,
        insight,
        suggested_action: action,
        health_worker: hw ?? null,
        caregiver,
      });

      if (action !== "monitor" || sugarRising || adherence < 75 || missed) {
        insights.push({
          id: `insight-${p.id}`,
          patient_id: p.id,
          patient_name: p.full_name,
          summary: insight,
          suggested_action: action,
          severity: risk,
          evidence: health.explain.why.bullets.slice(0, 3),
        });
      }
    }

    priority_queue.sort((a, b) => b.priority_score - a.priority_score);
    insights.sort((a, b) => riskRank(b.severity) - riskRank(a.severity));

    const emergency_alerts = store.alerts.filter(
      (a) =>
        ids.includes(a.patient_id) &&
        (a.severity === "critical" ||
          a.alert_type === "rural_emergency" ||
          a.severity === "high"),
    ).length;

    const summary: IntelligenceSummary = {
      total_patients: patients.length,
      active_followups: store.appointments.filter(
        (a) =>
          a.doctor_id === doctor.id &&
          a.status === "scheduled" &&
          a.scheduled_at.slice(0, 10) >= today,
      ).length,
      high_risk_patients: priority_queue.filter(
        (p) => p.risk_badge === "high" || p.risk_badge === "critical",
      ).length,
      missed_checkins: missedCheckins,
      appointments_today: store.appointments.filter(
        (a) =>
          a.doctor_id === doctor.id &&
          a.status === "scheduled" &&
          a.scheduled_at.slice(0, 10) === today,
      ).length,
      emergency_alerts,
    };

    const alerts = this.buildAlerts(userId, priority_queue);

    const filteredQueue = this.applyFilters(priority_queue, filters);

    return {
      summary,
      priority_queue: filteredQueue,
      insights: insights.slice(0, 8),
      alerts,
      trends: this.buildTrends(priority_queue),
      diseases: [
        ...new Set(priority_queue.flatMap((p) => p.conditions)),
      ].sort(),
      health_workers: [
        ...new Set(
          priority_queue
            .map((p) => p.health_worker)
            .filter((x): x is string => Boolean(x)),
        ),
      ],
    };
  },

  applyFilters(
    queue: PriorityPatientCard[],
    filters?: Partial<IntelligenceFilters>,
  ): PriorityPatientCard[] {
    if (!filters) return queue;
    let rows = [...queue];
    const q = filters.search?.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.full_name.toLowerCase().includes(q) ||
          p.abha_id?.toLowerCase().includes(q) ||
          p.phone?.toLowerCase().includes(q) ||
          p.conditions.some((c) => c.toLowerCase().includes(q)) ||
          p.insight.toLowerCase().includes(q),
      );
    }
    if (filters.risk) {
      rows = rows.filter((p) => p.risk_badge === filters.risk);
    }
    if (filters.disease) {
      const d = filters.disease.toLowerCase();
      rows = rows.filter((p) =>
        p.conditions.some((c) => c.toLowerCase().includes(d)),
      );
    }
    if (filters.age === "under_50") {
      rows = rows.filter((p) => p.age != null && p.age < 50);
    } else if (filters.age === "50_plus") {
      rows = rows.filter((p) => p.age != null && p.age >= 50);
    }
    if (filters.recovery === "low") {
      rows = rows.filter((p) => p.recovery_score < 60);
    } else if (filters.recovery === "mid") {
      rows = rows.filter((p) => p.recovery_score >= 60 && p.recovery_score < 80);
    } else if (filters.recovery === "high") {
      rows = rows.filter((p) => p.recovery_score >= 80);
    }
    if (filters.appointment === "has_upcoming") {
      rows = rows.filter((p) => Boolean(p.next_appointment_at));
    } else if (filters.appointment === "none") {
      rows = rows.filter((p) => !p.next_appointment_at);
    }
    if (filters.health_worker) {
      rows = rows.filter((p) => p.health_worker === filters.health_worker);
    }
    if (filters.caregiver === "yes") {
      rows = rows.filter((p) => Boolean(p.caregiver));
    } else if (filters.caregiver === "no") {
      rows = rows.filter((p) => !p.caregiver);
    }
    return rows;
  },

  buildAlerts(
    userId: string,
    queue: PriorityPatientCard[],
  ): IntelligenceAlert[] {
    const doctor = ensureDoctorUser(userId);
    const store = getStore();
    const ids = queue.map((p) => p.patient_id);
    const out: IntelligenceAlert[] = [];

    for (const a of store.alerts.filter((x) => ids.includes(x.patient_id))) {
      const name = queue.find((p) => p.patient_id === a.patient_id)?.full_name;
      out.push({
        id: a.id,
        category:
          a.alert_type === "rural_emergency" || a.severity === "critical"
            ? "emergency"
            : "escalated",
        severity: a.severity,
        title: a.title,
        body: a.body,
        patient_id: a.patient_id,
        patient_name: name ?? null,
        created_at: a.created_at,
        action_label: "Open patient",
        action_href: `/doctor/patients/${a.patient_id}?tab=risk`,
      });
    }

    for (const p of queue.filter(
      (x) => x.risk_badge === "high" || x.risk_badge === "critical",
    )) {
      out.push({
        id: `risk-${p.patient_id}`,
        category: "high_risk",
        severity: p.risk_badge,
        title: "High risk patient in queue",
        body: p.insight,
        patient_id: p.patient_id,
        patient_name: p.full_name,
        created_at: new Date().toISOString(),
        action_label: "Review",
        action_href: `/doctor/patients/${p.patient_id}?tab=risk`,
      });
    }

    for (const p of queue.filter((x) => x.medicine_adherence < 70)) {
      out.push({
        id: `med-${p.patient_id}`,
        category: "missed_medicine",
        severity: "moderate",
        title: "Medicine adherence concern",
        body: `${p.full_name} adherence ≈ ${p.medicine_adherence}%`,
        patient_id: p.patient_id,
        patient_name: p.full_name,
        created_at: new Date().toISOString(),
        action_label: "Medicines",
        action_href: `/doctor/patients/${p.patient_id}?tab=medicines`,
      });
    }

    for (const a of store.appointments.filter(
      (x) => x.doctor_id === doctor.id && x.status === "missed",
    )) {
      const name =
        queue.find((p) => p.patient_id === a.patient_id)?.full_name ||
        "Patient";
      out.push({
        id: `appt-${a.id}`,
        category: "missed_appointment",
        severity: "moderate",
        title: "Missed appointment",
        body: `${name} · ${new Date(a.scheduled_at).toLocaleString()}`,
        patient_id: a.patient_id,
        patient_name: name,
        created_at: a.scheduled_at,
        action_label: "Reschedule",
        action_href: "/doctor/appointments",
      });
    }

    // Offline sync pending (async-safe sync count approximated from IDB is handled in hooks)
    void countPendingSync;

    return out
      .sort((a, b) => riskRank(b.severity) - riskRank(a.severity))
      .slice(0, 24);
  },

  buildTrends(queue: PriorityPatientCard[]): CohortTrendPoint[] {
    // Synthetic 7-day cohort trend from current scores (demo-friendly, deterministic)
    const avgRecovery =
      queue.reduce((s, p) => s + p.recovery_score, 0) / Math.max(queue.length, 1);
    const avgAdh =
      queue.reduce((s, p) => s + p.medicine_adherence, 0) /
      Math.max(queue.length, 1);
    const avgRisk =
      queue.reduce((s, p) => s + riskRank(p.readmission_risk) * 25, 0) /
      Math.max(queue.length, 1);

    const points: CohortTrendPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const wobble = Math.sin(i * 0.9) * 3;
      points.push({
        day: d.toISOString().slice(5, 10),
        recovery_score: Number((avgRecovery - 6 + i + wobble).toFixed(1)),
        medicine_adherence: Number((avgAdh - 4 + i * 0.6).toFixed(1)),
        readmission_risk: Number(
          Math.max(10, avgRisk + 8 - i + wobble).toFixed(1),
        ),
      });
    }
    return points;
  },

  getAiPatientSummary(patientId: string): AiPatientSummaryView {
    const health = evaluateHealth(buildObservationsForPatient(patientId));
    const store = getStore();
    const patient = store.patients.find((p) => p.id === patientId);
    const profile = store.profiles.find((p) => p.id === patient?.user_id);
    const adherence = adherenceFor(patientId);
    const action = suggestAction(
      mapRisk(health.readmission.risk_category),
      health.recovery.recovery_score,
      health.alerts.action === "emergency",
    );
    const symptoms =
      health.trends.trends.find((t) => t.metric === "symptoms")?.natural_language ||
      "No recent symptom trend";

    return {
      patient_id: patientId,
      current_condition: (patient?.chronic_diseases || []).join(", ") || "Not recorded",
      recovery_trend: `${health.recovery.recovery_level.replaceAll("_", " ")} · ${health.recovery.recovery_score.toFixed(0)}/100`,
      medicine_adherence: `${adherence}% (assistive estimate)`,
      latest_symptoms: patient
        ? store.checkins
            .filter((c) => c.patient_id === patientId)
            .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
            ?.symptoms || []
        : [],
      attention_level: action,
      narrative: `${profile?.full_name || "Patient"}: ${health.explain.why.bullets[0] || health.recovery.summary} ${symptoms}`,
      disclaimer:
        "Assistive clinical decision support only. Never diagnoses or prescribes. The clinician decides.",
    };
  },
};
