import {
  getStore,
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
    return {
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      username: p.username,
      patient_id: patient?.id || null,
      doctor_id: doctor?.id || null,
      health_worker_id: hw?.id || null,
      is_archived: patient?.is_archived ?? false,
    };
  });
}

export function addPerson(input: {
  full_name: string;
  email: string;
  role: Role;
  phone?: string;
  username?: string;
}) {
  const id = newId();
  const now = new Date().toISOString();
  updateStore((draft) => {
    draft.profiles.push({
      id,
      email: input.email.trim().toLowerCase(),
      full_name: input.full_name.trim(),
      phone: input.phone?.trim() || null,
      role: input.role,
      locale: "en",
      username: input.username?.trim() || input.email.split("@")[0] || null,
      address: null,
      notification_prefs: {
        medicine: true,
        appointment: true,
        tips: true,
        doctor_messages: true,
      },
    });
    if (input.role === "patient") {
      const patientId = newId();
      draft.patients.push({
        id: patientId,
        user_id: id,
        date_of_birth: null,
        sex: null,
        blood_group: null,
        abha_id_demo: null,
        address: null,
        chronic_diseases: [],
        allergies: [],
        medical_history: null,
        emergency_contact: null,
        caregiver_info: null,
        preferred_language: "en",
        status: "active",
        is_archived: false,
        created_at: now,
      });
      draft.passports.push({
        patient_id: patientId,
        qr_token: `HN${patientId.slice(0, 8).toUpperCase()}`,
        abha_id_demo: null,
        allergies: [],
        medical_history: null,
        emergency_contacts: null,
        current_medicines: [],
        blood_group: null,
      });
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
        area: "Demo area",
        phone: input.phone?.trim() || null,
      });
    }
  });
  return id;
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

export function restoreDemoSeedHint() {
  return "Hard refresh after STORE_VERSION bump reseeds local demo data.";
}
