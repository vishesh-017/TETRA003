import { getStore, IDS } from "@/data/store";
import { doctorRepository } from "@/modules/doctor/repository";
import type {
  AiSummary,
  AppointmentItem,
  CarePlan,
  CheckInItem,
  DashboardStats,
  DischargeSummary,
  HighRiskPatient,
  MedicineItem,
  PatientDetail,
  PatientListItem,
} from "@/modules/doctor/types";

function actorId(token: string | null): string {
  if (!token) return IDS.doctorUser;
  if (token === "demo-token-doctor") return IDS.doctorUser;
  if (token.length === 36) return token;
  return IDS.doctorUser;
}

export const doctorApi = {
  dashboard: (token: string | null) =>
    Promise.resolve(doctorRepository.dashboard(actorId(token)) as DashboardStats),

  highRisk: (
    token: string | null,
    params?: { min_risk?: string; sort_by?: string },
  ) =>
    Promise.resolve(
      doctorRepository.highRisk(actorId(token), params) as HighRiskPatient[],
    ),

  listPatients: (
    token: string | null,
    params?: { search?: string; status?: string; include_archived?: boolean },
  ) =>
    Promise.resolve(
      doctorRepository.listPatients(actorId(token), params) as PatientListItem[],
    ),

  getPatient: (token: string | null, id: string) =>
    Promise.resolve(doctorRepository.getPatient(actorId(token), id) as PatientDetail),

  createPatient: (token: string | null, body: Record<string, unknown>) =>
    Promise.resolve(
      doctorRepository.createPatient(actorId(token), body) as PatientDetail,
    ),

  updatePatient: (
    token: string | null,
    id: string,
    body: Record<string, unknown>,
  ) =>
    Promise.resolve(
      doctorRepository.updatePatient(actorId(token), id, body) as PatientDetail,
    ),

  archivePatient: (token: string | null, id: string) =>
    Promise.resolve(doctorRepository.archivePatient(actorId(token), id)),

  listDischarges: (token: string | null, patientId: string) =>
    Promise.resolve(
      doctorRepository.listDischarges(
        actorId(token),
        patientId,
      ) as DischargeSummary[],
    ),

  createDischarge: (
    token: string | null,
    patientId: string,
    body: Record<string, unknown>,
  ) =>
    Promise.resolve(
      doctorRepository.upsertDischarge(
        actorId(token),
        patientId,
        body,
      ) as DischargeSummary,
    ),

  updateDischarge: (
    token: string | null,
    dischargeId: string,
    body: Record<string, unknown>,
  ) => {
    const row = getStore().discharges.find((d) => d.id === dischargeId);
    if (!row) return Promise.reject(new Error("Discharge not found"));
    return Promise.resolve(
      doctorRepository.upsertDischarge(
        actorId(token),
        row.patient_id,
        body,
        dischargeId,
      ) as DischargeSummary,
    );
  },

  finalizeDischarge: (token: string | null, dischargeId: string) =>
    Promise.resolve(
      doctorRepository.finalizeDischarge(actorId(token), dischargeId) as CarePlan,
    ),

  listCarePlans: (token: string | null, patientId: string) =>
    Promise.resolve(
      doctorRepository.listCarePlans(actorId(token), patientId) as CarePlan[],
    ),

  approveCarePlan: (
    token: string | null,
    carePlanId: string,
    body: Record<string, unknown>,
  ) =>
    Promise.resolve(
      doctorRepository.approveCarePlan(
        actorId(token),
        carePlanId,
        body,
      ) as CarePlan,
    ),

  aiSummary: (token: string | null, patientId: string) =>
    Promise.resolve(
      doctorRepository.aiSummary(actorId(token), patientId) as AiSummary,
    ),

  listCheckins: (token: string | null, patientId: string) =>
    Promise.resolve(
      doctorRepository.listCheckins(actorId(token), patientId) as CheckInItem[],
    ),

  listMedicines: (token: string | null, patientId: string) =>
    Promise.resolve(
      doctorRepository.listMedicines(actorId(token), patientId) as MedicineItem[],
    ),

  listAppointments: (
    token: string | null,
    _params?: { status?: string; patient_id?: string },
  ) =>
    Promise.resolve(
      doctorRepository.listAppointments(actorId(token)) as AppointmentItem[],
    ),

  createAppointment: (token: string | null, body: Record<string, unknown>) =>
    Promise.resolve(
      doctorRepository.createAppointment(
        actorId(token),
        body,
      ) as AppointmentItem,
    ),

  updateAppointment: (
    token: string | null,
    id: string,
    body: Record<string, unknown>,
  ) =>
    Promise.resolve(
      doctorRepository.updateAppointment(
        actorId(token),
        id,
        body,
      ) as AppointmentItem,
    ),

  cancelAppointment: (token: string | null, id: string) =>
    Promise.resolve(
      doctorRepository.cancelAppointment(actorId(token), id) as AppointmentItem,
    ),
};
