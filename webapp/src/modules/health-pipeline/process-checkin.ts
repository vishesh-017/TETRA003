import { env } from "@/config/env";
import {
  getStore,
  IDS,
  newId,
  updateStore,
  type AlertRow,
  type RiskLevel,
} from "@/data/store";
import {
  evaluateHealth,
  type AlertAction,
  type HealthIntelligenceBundle,
} from "@/lib/health-engine";
import { getSupabaseClient } from "@/lib/supabase";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";
import {
  isPredictionEngineConfigured,
  predictionApi,
} from "@/modules/prediction/api";
import type { PatientObservationBundle } from "@/modules/prediction/types";

async function refineScoresWithMl(
  patientId: string,
  obs: PatientObservationBundle,
  local: HealthIntelligenceBundle,
) {
  if (!isPredictionEngineConfigured()) return;
  try {
    const [recovery, readmission] = await Promise.all([
      predictionApi.recoveryScore(obs),
      predictionApi.readmission({
        ...obs,
        recovery_score: local.recovery.recovery_score,
      }),
    ]);
    const recoveryScore = Math.round(
      recovery.recovery_score ?? local.recovery.recovery_score,
    );
    const riskScore = Math.round(
      readmission.readmission_probability_percent ??
        local.readmission.readmission_probability_percent,
    );
    const riskLevel = mapReadmissionLevel(
      readmission.risk_category || local.readmission.risk_category,
      recoveryScore,
    );
    const now = new Date().toISOString();
    updateStore((draft) => {
      const recoveryRow = draft.recoveryScores.find(
        (r) => r.patient_id === patientId,
      );
      if (recoveryRow) {
        recoveryRow.score = recoveryScore;
        recoveryRow.computed_at = now;
      }
      const risk = draft.risks.find((r) => r.patient_id === patientId);
      if (risk) {
        risk.score = riskScore;
        risk.level = riskLevel;
        risk.computed_at = now;
      }
    });
  } catch {
    /* keep local dynamic scores */
  }
}

export interface CheckInPipelineResult {
  health: HealthIntelligenceBundle;
  escalated: boolean;
  alert: AlertRow | null;
  recovery_score: number;
  risk_level: RiskLevel;
  notified_doctor: boolean;
  notified_caregivers: number;
}

function actionToSeverity(action: AlertAction): RiskLevel | null {
  switch (action) {
    case "emergency":
      return "critical";
    case "immediate_attention":
      return "high";
    case "doctor_review":
      return "high";
    case "monitor":
      return "moderate";
    default:
      return null;
  }
}

function mapReadmissionLevel(
  category: string,
  recovery: number,
): RiskLevel {
  if (category === "critical" || recovery < 40) return "critical";
  if (category === "high" || recovery < 60) return "high";
  if (category === "moderate") return "moderate";
  return "low";
}

function daysWithoutCheckIn(patientId: string, beforeIso: string): number {
  const day = beforeIso.slice(0, 10);
  const prior = getStore()
    .checkins.filter(
      (c) => c.patient_id === patientId && c.recorded_at.slice(0, 10) < day,
    )
    .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at));
  if (!prior.length) return 3;
  const last = prior[0]!.recorded_at.slice(0, 10);
  const ms =
    new Date(`${day}T12:00:00`).getTime() -
    new Date(`${last}T12:00:00`).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function consecutiveMissedMeds(patientId: string): number {
  const events = getStore()
    .medicineEvents.filter((e) => e.patient_id === patientId)
    .sort((a, b) => b.acted_at.localeCompare(a.acted_at));
  let streak = 0;
  for (const e of events) {
    if (e.status === "missed" || e.status === "skipped") streak += 1;
    else break;
  }
  return streak;
}

async function persistPredictions(
  patientId: string,
  score: number,
  level: RiskLevel,
  riskScore: number,
) {
  if (!env.isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const now = new Date().toISOString();
  await Promise.all([
    supabase.from("recovery_scores").upsert({
      patient_id: patientId,
      score,
      computed_at: now,
    }),
    supabase.from("risk_scores").upsert({
      patient_id: patientId,
      score: riskScore,
      level,
      computed_at: now,
    }),
  ]);
}

async function persistAlert(alert: AlertRow) {
  if (!env.isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from("alerts").upsert({
    id: alert.id,
    patient_id: alert.patient_id,
    alert_type: alert.alert_type,
    severity: alert.severity,
    title: alert.title,
    body: alert.body,
    reason: alert.reason,
    status: alert.status,
    assigned_doctor_id: alert.assigned_doctor_id,
    checkin_id: alert.checkin_id,
    resolved_at: alert.resolved_at,
    created_at: alert.created_at,
  });
}

async function persistNotification(row: {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}) {
  if (!env.isSupabaseConfigured) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await supabase.from("notifications").insert(row);
}

/** Sync store recovery/risk from Health Intelligence Engine (single source of truth). */
export function syncScoresFromEngine(patientId: string): {
  health: HealthIntelligenceBundle;
  recovery_score: number;
  risk_level: RiskLevel;
  risk_score: number;
} {
  const obs = buildObservationsForPatient(patientId);
  obs.missed_medicine_doses_7d = Math.max(
    obs.missed_medicine_doses_7d ?? 0,
    consecutiveMissedMeds(patientId),
  );
  // Local engine is always dynamic from current vitals/adherence.
  // Optional ML service can refine scores when VITE_AI_API_BASE_URL is set.
  const health = evaluateHealth(obs);
  void refineScoresWithMl(patientId, obs, health).catch(() => undefined);
  const recoveryScore = Math.round(health.recovery.recovery_score);
  const riskLevel = mapReadmissionLevel(
    health.readmission.risk_category,
    recoveryScore,
  );
  const riskScore = Math.round(
    health.readmission.readmission_probability_percent,
  );
  const now = new Date().toISOString();

  updateStore((draft) => {
    const recovery = draft.recoveryScores.find((r) => r.patient_id === patientId);
    if (recovery) {
      recovery.score = recoveryScore;
      recovery.computed_at = now;
    } else {
      draft.recoveryScores.push({
        patient_id: patientId,
        score: recoveryScore,
        computed_at: now,
      });
    }

    const risk = draft.risks.find((r) => r.patient_id === patientId);
    if (risk) {
      risk.score = riskScore;
      risk.level = riskLevel;
      risk.computed_at = now;
    } else {
      draft.risks.push({
        patient_id: patientId,
        score: riskScore,
        level: riskLevel,
        computed_at: now,
      });
    }
  });

  void persistPredictions(patientId, recoveryScore, riskLevel, riskScore);
  return {
    health,
    recovery_score: recoveryScore,
    risk_level: riskLevel,
    risk_score: riskScore,
  };
}

/**
 * After a check-in is stored: evaluate health intelligence, persist scores,
 * escalate if thresholds breached, notify doctor + caregivers.
 */
export async function processCheckInPipeline(
  patientId: string,
  checkInId: string | null,
): Promise<CheckInPipelineResult> {
  const store = getStore();
  const checkIn = checkInId
    ? store.checkins.find((c) => c.id === checkInId)
    : undefined;
  const missedDays = checkIn
    ? daysWithoutCheckIn(patientId, checkIn.recorded_at)
    : 0;
  const missedMedStreak = consecutiveMissedMeds(patientId);

  const obs = buildObservationsForPatient(patientId);
  obs.missed_checkin_days = missedDays;
  obs.missed_medicine_doses_7d = Math.max(
    obs.missed_medicine_doses_7d ?? 0,
    missedMedStreak,
    checkIn?.medicine_taken === false ? 2 : 0,
  );

  const health = evaluateHealth(obs);
  const recoveryScore = Math.round(health.recovery.recovery_score);
  const riskLevel = mapReadmissionLevel(
    health.readmission.risk_category,
    recoveryScore,
  );
  const riskScore = Math.round(health.readmission.readmission_probability_percent);
  const now = new Date().toISOString();

  updateStore((draft) => {
    const recovery = draft.recoveryScores.find((r) => r.patient_id === patientId);
    if (recovery) {
      recovery.score = recoveryScore;
      recovery.computed_at = now;
    } else {
      draft.recoveryScores.push({
        patient_id: patientId,
        score: recoveryScore,
        computed_at: now,
      });
    }

    const risk = draft.risks.find((r) => r.patient_id === patientId);
    if (risk) {
      risk.score = riskScore;
      risk.level = riskLevel;
      risk.computed_at = now;
    } else {
      draft.risks.push({
        patient_id: patientId,
        score: riskScore,
        level: riskLevel,
        computed_at: now,
      });
    }
  });

  await persistPredictions(patientId, recoveryScore, riskLevel, riskScore);

  const severity = actionToSeverity(health.alerts.action);
  if (!severity) {
    return {
      health,
      escalated: false,
      alert: null,
      recovery_score: recoveryScore,
      risk_level: riskLevel,
      notified_doctor: false,
      notified_caregivers: 0,
    };
  }

  const doctor =
    store.doctors.find((d) => d.id === IDS.doctor) || store.doctors[0];
  const patient = store.patients.find((p) => p.id === patientId);
  const profile = store.profiles.find((p) => p.id === patient?.user_id);
  const patientName = profile?.full_name || "Patient";
  const reason =
    health.alerts.rationale.join(" · ") || health.alerts.clinician_message;

  const alert: AlertRow = {
    id: newId(),
    patient_id: patientId,
    alert_type: `checkin_${health.alerts.action}`,
    severity,
    title: health.alerts.title,
    body: `${patientName}: ${reason}`,
    reason,
    status: "open",
    assigned_doctor_id: doctor?.id ?? null,
    checkin_id: checkInId,
    resolved_at: null,
    created_at: now,
  };

  let notifiedDoctor = false;
  let notifiedCaregivers = 0;
  let createdNewAlert = false;

  updateStore((draft) => {
    const hourAgo = Date.now() - 60 * 60 * 1000;
    const duplicate = draft.alerts.find(
      (a) =>
        a.patient_id === patientId &&
        a.status === "open" &&
        a.alert_type === alert.alert_type &&
        new Date(a.created_at).getTime() >= hourAgo,
    );
    if (duplicate) {
      duplicate.body = alert.body;
      duplicate.reason = alert.reason;
      duplicate.severity = alert.severity;
      duplicate.checkin_id = alert.checkin_id;
      duplicate.created_at = now;
      alert.id = duplicate.id;
    } else {
      draft.alerts.unshift(alert);
      createdNewAlert = true;
    }

    if (!createdNewAlert) return;

    if (doctor) {
      draft.notifications.unshift({
        id: newId(),
        user_id: doctor.user_id,
        type: severity === "critical" ? "emergency" : "doctor_message",
        title: `${severity === "critical" ? "Critical" : "Escalation"}: ${patientName}`,
        body: reason,
        read: false,
        created_at: now,
      });
      notifiedDoctor = true;
    }

    if (patient) {
      draft.notifications.unshift({
        id: newId(),
        user_id: patient.user_id,
        type: severity === "critical" ? "emergency" : "doctor_message",
        title: "Care team alert from your check-in",
        body: health.alerts.patient_message,
        read: false,
        created_at: now,
      });
    }

    const caregivers = draft.caregiverArrangements.filter(
      (a) =>
        a.patient_id === patientId &&
        a.status === "active" &&
        a.permissions.receive_alerts,
    );
    for (const cg of caregivers) {
      draft.notifications.unshift({
        id: newId(),
        user_id: cg.caregiver_user_id,
        type: severity === "critical" ? "emergency" : "doctor_message",
        title:
          severity === "critical"
            ? `Emergency alert · ${patientName}`
            : `Health alert · ${patientName}`,
        body: reason,
        read: false,
        created_at: now,
      });
      notifiedCaregivers += 1;
    }
  });

  await persistAlert(alert);
  const fresh = getStore();
  const newNotes = fresh.notifications.filter((n) => n.created_at === now);
  await Promise.all(newNotes.map((n) => persistNotification(n)));

  return {
    health,
    escalated: true,
    alert,
    recovery_score: recoveryScore,
    risk_level: riskLevel,
    notified_doctor: notifiedDoctor,
    notified_caregivers: notifiedCaregivers,
  };
}

/** Re-run score sync + escalation after medicine events (missed streak). */
export async function processAdherencePipeline(patientId: string) {
  return processCheckInPipeline(patientId, null);
}
