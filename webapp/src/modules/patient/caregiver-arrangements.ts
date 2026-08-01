import {
  DEFAULT_CAREGIVER_PERMISSIONS,
  getStore,
  newId,
  updateStore,
  type CaregiverArrangementRow,
  type CaregiverPermissions,
} from "@/data/store";

export interface CaregiverInviteInput {
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  permissions?: Partial<CaregiverPermissions>;
  makePrimary?: boolean;
}

export interface CaregiverArrangementView {
  id: string;
  caregiver_name: string;
  caregiver_phone: string;
  caregiver_email: string | null;
  relationship: string;
  status: CaregiverArrangementRow["status"];
  invite_code: string;
  is_primary: boolean;
  permissions: CaregiverPermissions;
  created_at: string;
  login_hint: string;
}

function resolvePatientId(userId: string): string {
  const store = getStore();
  const patient = store.patients.find((p) => p.user_id === userId);
  if (!patient) throw new Error("Patient profile not found");
  return patient.id;
}

/** Cryptographically unique invite — not guessable from names. */
function makeInviteCode(): string {
  const part = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()
      : Math.random().toString(36).slice(2, 10).toUpperCase();
  let code = `CG-${part()}-${part().slice(0, 4)}`;
  const existing = new Set(
    getStore().caregiverArrangements.map((a) => a.invite_code),
  );
  while (existing.has(code)) {
    code = `CG-${part()}-${part().slice(0, 4)}`;
  }
  return code;
}

function emailFromName(name: string, phone: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 24);
  const tail = phone.replace(/\D/g, "").slice(-4) || "care";
  return `${slug || "caregiver"}.${tail}@healnexus.demo`;
}

export const patientCaregiverService = {
  list(userId: string): CaregiverArrangementView[] {
    const patientId = resolvePatientId(userId);
    return getStore()
      .caregiverArrangements.filter(
        (a) => a.patient_id === patientId && a.status !== "revoked",
      )
      .sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
      .map((a) => ({
        id: a.id,
        caregiver_name: a.caregiver_name,
        caregiver_phone: a.caregiver_phone,
        caregiver_email: a.caregiver_email,
        relationship: a.relationship,
        status: a.status,
        invite_code: a.invite_code,
        is_primary: a.is_primary,
        permissions: a.permissions,
        created_at: a.created_at,
        login_hint: `Invite code ${a.invite_code} · or live login as Caregiver if linked to Priya`,
      }));
  },

  add(userId: string, input: CaregiverInviteInput) {
    const patientId = resolvePatientId(userId);
    const name = input.name.trim();
    const phone = input.phone.trim();
    const relationship = input.relationship.trim() || "Family";
    if (!name || !phone) {
      throw new Error("Caregiver name and phone are required");
    }

    const email = (input.email?.trim() || emailFromName(name, phone)).toLowerCase();
    const inviteCode = makeInviteCode();
    const permissions: CaregiverPermissions = {
      ...DEFAULT_CAREGIVER_PERMISSIONS,
      ...input.permissions,
    };

    let created!: CaregiverArrangementRow;
    let caregiverUserId = "";

    updateStore((draft) => {
      const existingProfile = draft.profiles.find(
        (p) =>
          p.role === "caregiver" &&
          (p.email?.toLowerCase() === email || p.phone === phone),
      );

      if (existingProfile) {
        caregiverUserId = existingProfile.id;
        existingProfile.full_name = name;
        existingProfile.phone = phone;
        existingProfile.email = email;
      } else {
        caregiverUserId = newId();
        draft.profiles.push({
          id: caregiverUserId,
          email,
          full_name: name,
          phone,
          role: "caregiver",
          locale: "en",
          username: name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ".")
            .replace(/^\.|\.$/g, "")
            .slice(0, 24) || `caregiver.${caregiverUserId.slice(-4)}`,
          address: null,
          notification_prefs: {
            medicine: true,
            appointment: true,
            tips: true,
            doctor_messages: true,
          },
        });
      }

      const makePrimary =
        input.makePrimary !== false ||
        !draft.caregiverArrangements.some(
          (a) => a.patient_id === patientId && a.status === "active" && a.is_primary,
        );

      if (makePrimary) {
        draft.caregiverArrangements.forEach((a) => {
          if (a.patient_id === patientId) a.is_primary = false;
        });
      }

      // Avoid duplicate active link for same caregiver+patient
      const dup = draft.caregiverArrangements.find(
        (a) =>
          a.patient_id === patientId &&
          a.caregiver_user_id === caregiverUserId &&
          a.status !== "revoked",
      );
      if (dup) {
        dup.caregiver_name = name;
        dup.caregiver_phone = phone;
        dup.caregiver_email = email;
        dup.relationship = relationship;
        dup.permissions = permissions;
        dup.status = "active";
        dup.is_primary = makePrimary;
        dup.invite_code = inviteCode;
        dup.accepted_at = new Date().toISOString();
        created = dup;
      } else {
        created = {
          id: newId(),
          patient_id: patientId,
          caregiver_user_id: caregiverUserId,
          caregiver_name: name,
          caregiver_phone: phone,
          caregiver_email: email,
          relationship,
          permissions,
          status: "active",
          invite_code: inviteCode,
          is_primary: makePrimary,
          created_at: new Date().toISOString(),
          accepted_at: new Date().toISOString(),
        };
        draft.caregiverArrangements.push(created);
      }

      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient && makePrimary) {
        patient.caregiver_info = {
          name,
          phone,
          relationship,
        };
      }

      const patientUser = draft.patients.find((p) => p.id === patientId)?.user_id;
      if (patientUser) {
        draft.notifications.unshift({
          id: newId(),
          user_id: patientUser,
          type: "doctor_message",
          title: "Caregiver linked",
          body: `${name} (${relationship}) can now support your recovery. Invite code: ${inviteCode}`,
          read: false,
          created_at: new Date().toISOString(),
        });
      }

      draft.notifications.unshift({
        id: newId(),
        user_id: caregiverUserId,
        type: "doctor_message",
        title: "You were added as a caregiver",
        body: `A patient linked you for post-discharge support. Use invite code ${inviteCode} on the login screen.`,
        read: false,
        created_at: new Date().toISOString(),
      });
    });

    return {
      arrangement: created,
      invite_code: inviteCode,
      caregiver_email: email,
      caregiver_user_id: caregiverUserId,
      message: `${name} is linked. They can open HealNexus → Login → enter invite code ${inviteCode}.`,
    };
  },

  setPrimary(userId: string, arrangementId: string) {
    const patientId = resolvePatientId(userId);
    updateStore((draft) => {
      const target = draft.caregiverArrangements.find(
        (a) => a.id === arrangementId && a.patient_id === patientId,
      );
      if (!target || target.status === "revoked") {
        throw new Error("Caregiver arrangement not found");
      }
      draft.caregiverArrangements.forEach((a) => {
        if (a.patient_id === patientId) a.is_primary = a.id === arrangementId;
      });
      const patient = draft.patients.find((p) => p.id === patientId);
      if (patient) {
        patient.caregiver_info = {
          name: target.caregiver_name,
          phone: target.caregiver_phone,
          relationship: target.relationship,
        };
      }
    });
    return this.list(userId);
  },

  revoke(userId: string, arrangementId: string) {
    const patientId = resolvePatientId(userId);
    updateStore((draft) => {
      const target = draft.caregiverArrangements.find(
        (a) => a.id === arrangementId && a.patient_id === patientId,
      );
      if (!target) throw new Error("Caregiver arrangement not found");
      target.status = "revoked";
      target.is_primary = false;

      const nextPrimary = draft.caregiverArrangements.find(
        (a) => a.patient_id === patientId && a.status === "active",
      );
      const patient = draft.patients.find((p) => p.id === patientId);
      if (nextPrimary) {
        nextPrimary.is_primary = true;
        if (patient) {
          patient.caregiver_info = {
            name: nextPrimary.caregiver_name,
            phone: nextPrimary.caregiver_phone,
            relationship: nextPrimary.relationship,
          };
        }
      } else if (patient) {
        patient.caregiver_info = null;
      }
    });
    return this.list(userId);
  },

  acceptInvite(inviteCode: string) {
    const code = inviteCode.trim().toUpperCase();
    let caregiverUserId: string | null = null;
    updateStore((draft) => {
      const row = draft.caregiverArrangements.find(
        (a) => a.invite_code.toUpperCase() === code && a.status !== "revoked",
      );
      if (!row) throw new Error("Invalid or expired invite code");
      row.status = "active";
      row.accepted_at = new Date().toISOString();
      caregiverUserId = row.caregiver_user_id;
    });
    if (!caregiverUserId) throw new Error("Invalid or expired invite code");
    const profile = getStore().profiles.find((p) => p.id === caregiverUserId);
    if (!profile) throw new Error("Caregiver profile missing");
    return profile;
  },
};
