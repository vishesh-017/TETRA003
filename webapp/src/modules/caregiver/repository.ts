import { getStore, updateStore } from "@/data/store";
import { patientRepository } from "@/modules/patient/repository";

import {
  buildCaregiverWorkspace,
  findArrangementByInviteCode,
  type CaregiverWorkspace,
} from "./arrangement-builder";

export const caregiverRepository = {
  getWorkspace(caregiverUserId: string): CaregiverWorkspace {
    return buildCaregiverWorkspace(caregiverUserId);
  },

  findByInviteCode(code: string) {
    return findArrangementByInviteCode(code);
  },

  getNotificationPrefs(caregiverUserId: string) {
    const profile = getStore().profiles.find((p) => p.id === caregiverUserId);
    return (
      profile?.notification_prefs ?? {
        medicine: true,
        appointment: true,
        tips: true,
        doctor_messages: true,
      }
    );
  },

  updateNotificationPrefs(
    caregiverUserId: string,
    prefs: {
      medicine: boolean;
      appointment: boolean;
      tips: boolean;
      doctor_messages: boolean;
    },
  ) {
    updateStore((draft) => {
      const profile = draft.profiles.find((p) => p.id === caregiverUserId);
      if (!profile) throw new Error("Caregiver profile not found");
      profile.notification_prefs = prefs;
    });
    return this.getNotificationPrefs(caregiverUserId);
  },

  async markMedicineForPatient(
    patientUserId: string,
    medicineId: string,
    status: "taken" | "skipped",
  ) {
    return patientRepository.markMedicine(patientUserId, medicineId, status);
  },

  async requestAppointmentActionForPatient(
    patientUserId: string,
    appointmentId: string,
    action: "reschedule" | "cancel",
  ) {
    return patientRepository.requestAppointmentAction(
      patientUserId,
      appointmentId,
      action,
    );
  },
};
