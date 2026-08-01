import {
  getStore,
  IDS,
  newId,
  updateStore,
  type Role,
} from "@/data/store";

export function listPeople() {
  const store = getStore();
  return store.profiles.map((p) => {
    const patient = store.patients.find((x) => x.user_id === p.id);
    const doctor = store.doctors.find((x) => x.user_id === p.id);
    const hw = store.healthWorkers.find((x) => x.user_id === p.id);
    const passport = patient
      ? store.passports.find((x) => x.patient_id === patient.id)
      : null;
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      username: p.username,
      has_password: Boolean(p.password),
      patient_id: patient?.id || null,
      doctor_id: doctor?.id || null,
      health_worker_id: hw?.id || null,
      passport_token: passport?.qr_token || null,
      blood_group: patient?.blood_group || null,
      is_archived: patient?.is_archived ?? false,
    };
  });
}

function normalizeUsername(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/^\.|\.$/g, "")
    .slice(0, 32);
}

export function addPerson(input: {
  full_name: string;
  email?: string;
  role: Role;
  phone?: string;
  username: string;
  password: string;
  /** Patient passport / clinical basics */
  date_of_birth?: string;
  sex?: string;
  blood_group?: string;
  allergies?: string;
  chronic_diseases?: string;
  emergency_name?: string;
  emergency_phone?: string;
  city?: string;
}) {
  const username = normalizeUsername(input.username);
  if (!username) throw new Error("User ID is required");
  if (!input.password || input.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  const store = getStore();
  if (
    store.profiles.some(
      (p) => p.username?.toLowerCase() === username ||
        (input.email &&
          p.email?.toLowerCase() === input.email.trim().toLowerCase()),
    )
  ) {
    throw new Error("User ID or email already exists");
  }

  const id = newId();
  const now = new Date().toISOString();
  const email =
    input.email?.trim().toLowerCase() || `${username}@healnexus.local`;
  let passportToken: string | null = null;

  updateStore((draft) => {
    draft.profiles.push({
      id,
      email,
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      role: input.role,
      locale: "en",
      username,
      password: input.password,
      address: input.city ? { city: input.city } : null,
      notification_prefs: {
        medicine: true,
        appointment: true,
        tips: true,
        doctor_messages: true,
      },
    });

    if (input.role === "patient") {
      const patientId = newId();
      const allergies = (input.allergies || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const diseases = (input.chronic_diseases || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      passportToken = `HN${username.replace(/[^a-z0-9]/gi, "").slice(0, 8).toUpperCase()}${patientId.slice(0, 4).toUpperCase()}`;

      draft.patients.push({
        id: patientId,
        user_id: id,
        date_of_birth: input.date_of_birth || null,
        sex: input.sex || null,
        blood_group: input.blood_group || null,
        abha_id_demo: null,
        address: input.city ? { city: input.city } : null,
        chronic_diseases: diseases,
        allergies,
        medical_history: diseases.length
          ? `Registered via admin · ${diseases.join(", ")}`
          : null,
        emergency_contact:
          input.emergency_name || input.emergency_phone
            ? {
                name: input.emergency_name || "Emergency contact",
                phone: input.emergency_phone || "",
                relationship: "family",
              }
            : null,
        caregiver_info: null,
        preferred_language: "en",
        status: "active",
        is_archived: false,
        created_at: now,
      });

      draft.passports.push({
        patient_id: patientId,
        qr_token: passportToken,
        abha_id_demo: null,
        allergies,
        medical_history: diseases.join(", ") || null,
        emergency_contacts:
          input.emergency_name || input.emergency_phone
            ? {
                name: input.emergency_name || "Emergency contact",
                phone: input.emergency_phone || "",
                relationship: "family",
              }
            : null,
        current_medicines: [],
        blood_group: input.blood_group || null,
      });

      draft.relationships.push({
        doctor_id: IDS.doctor,
        patient_id: patientId,
        status: "active",
      });
      // No seeded recovery/risk — UI shows NA until first check-in.
    }

    if (input.role === "doctor") {
      draft.doctors.push({
        id: newId(),
        user_id: id,
        specialty: "General Medicine",
        hospital_affiliation: "HealNexus Network",
      });
    }
    if (input.role === "health_worker") {
      draft.healthWorkers.push({
        id: newId(),
        user_id: id,
        area: input.city || "Field area",
        phone: input.phone?.trim() || null,
      });
    }
  });

  return {
    id,
    username,
    password: input.password,
    email,
    passport_token: passportToken,
  };
}

export function removePerson(userId: string) {
  updateStore((draft) => {
    const patient = draft.patients.find((p) => p.user_id === userId);
    if (patient) {
      patient.is_archived = true;
      patient.status = "archived";
      draft.relationships = draft.relationships.filter(
        (r) => r.patient_id !== patient.id,
      );
    }
    draft.profiles = draft.profiles.filter((p) => p.id !== userId);
    draft.doctors = draft.doctors.filter((d) => d.user_id !== userId);
    draft.healthWorkers = draft.healthWorkers.filter((h) => h.user_id !== userId);
    draft.caregiverArrangements = draft.caregiverArrangements.filter(
      (a) => a.caregiver_user_id !== userId,
    );
  });
}
