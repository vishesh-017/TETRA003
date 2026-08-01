import {
  getStore,
  newId,
  todayKey,
  updateStore,
  type AiCheckupRow,
} from "@/data/store";
import { investigationRepository } from "@/modules/investigations/repository";
import { runAiCheckup } from "@/modules/ai-support/checkup-engine";
import { syncScoresFromEngine } from "@/modules/health-pipeline/process-checkin";
import type { AiCheckupResult } from "@/modules/ai-support/types";

export function persistAiCheckup(result: AiCheckupResult): AiCheckupRow {
  const row: AiCheckupRow = {
    id: newId(),
    patient_id: result.patient_id,
    assessed_at: result.assessed_at,
    overall_risk: result.overall_risk,
    recovery_score: result.recovery_score,
    readmission_probability_percent: result.readmission_probability_percent,
    summary: result.summary,
    warning_signs: result.warning_signs,
    missing_tests: result.missing_investigations.map((m) => m.test_name),
    referral_specialty: result.referral.recommended
      ? result.referral.specialty
      : null,
    payload: result as unknown as Record<string, unknown>,
  };

  updateStore((draft) => {
    draft.aiCheckups.unshift(row);
    // Keep last 20 per patient
    const keep = draft.aiCheckups.filter((c) => c.patient_id === result.patient_id);
    if (keep.length > 20) {
      const drop = new Set(keep.slice(20).map((c) => c.id));
      draft.aiCheckups = draft.aiCheckups.filter((c) => !drop.has(c.id));
    }

    draft.healthRecords.unshift({
      id: newId(),
      patient_id: result.patient_id,
      category: "doctor_note",
      title: `AI Checkup · ${result.overall_risk} risk`,
      summary: result.summary.slice(0, 280),
      recorded_at: result.assessed_at,
      source: "local",
      metadata: {
        recovery_score: result.recovery_score,
        missing_tests: result.missing_investigations.map((m) => m.test_name),
      },
    });

    if (
      result.referral.recommended &&
      (result.overall_risk === "high" || result.overall_risk === "critical")
    ) {
      const existingOpen = draft.alerts.some(
        (a) =>
          a.patient_id === result.patient_id &&
          a.status === "open" &&
          a.alert_type === "ai_checkup",
      );
      if (!existingOpen) {
        const doctorId =
          draft.relationships.find(
            (r) =>
              r.patient_id === result.patient_id && r.status === "active",
          )?.doctor_id || null;
        draft.alerts.unshift({
          id: newId(),
          patient_id: result.patient_id,
          alert_type: "ai_checkup",
          severity: result.overall_risk,
          title: "AI Checkup flagged elevated risk",
          body: result.summary.slice(0, 220),
          reason: result.warning_signs[0] || result.referral.message,
          status: "open",
          assigned_doctor_id: doctorId,
          checkin_id: null,
          resolved_at: null,
          created_at: result.assessed_at,
        });
      }
    }
  });

  syncScoresFromEngine(result.patient_id);
  return row;
}

export function runAndPersistCheckup(
  userOrPatientId: string,
): AiCheckupResult | null {
  const result = runAiCheckup(userOrPatientId);
  if (!result) return null;
  persistAiCheckup(result);
  return result;
}

export function listCheckups(patientId: string): AiCheckupRow[] {
  return getStore()
    .aiCheckups.filter((c) => c.patient_id === patientId)
    .sort((a, b) => b.assessed_at.localeCompare(a.assessed_at));
}

/** Accept a missing screening recommendation into live investigations. */
export function acceptScreeningTest(
  patientId: string,
  testName: string,
  purpose: string,
  priority: "routine" | "important" | "urgent" = "important",
) {
  const store = getStore();
  const doctorId =
    store.relationships.find(
      (r) => r.patient_id === patientId && r.status === "active",
    )?.doctor_id ||
    store.doctors[0]?.id;
  if (!doctorId) throw new Error("No doctor linked to order this test");

  const due = new Date();
  due.setDate(due.getDate() + (priority === "urgent" ? 2 : 7));

  return investigationRepository.createForPatient({
    patientId,
    doctorId,
    name: testName,
    purpose,
    due_date: due.toISOString().slice(0, 10),
    priority,
    notes: `Added from AI Checkup on ${todayKey()}`,
    requestedBy: "patient",
  });
}
