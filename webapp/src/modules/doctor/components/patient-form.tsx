import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  patientFormSchema,
  toPatientPayload,
  type PatientFormSchema,
} from "@/modules/doctor/schemas";
import type { PatientDetail } from "@/modules/doctor/types";

interface PatientFormProps {
  initial?: PatientDetail | null;
  submitting?: boolean;
  onSubmit: (payload: Record<string, unknown>) => void;
  onCancel?: () => void;
}

function defaultsFromPatient(patient?: PatientDetail | null): PatientFormSchema {
  const address = patient?.address as { line1?: string; city?: string } | undefined;
  return {
    full_name: patient?.full_name ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    date_of_birth: patient?.date_of_birth ?? "",
    sex: patient?.sex ?? "",
    blood_group: patient?.blood_group ?? "",
    address_line: address?.line1 ?? "",
    city: address?.city ?? "Ahmedabad",
    chronic_diseases: (patient?.chronic_diseases || []).join(", "),
    allergies: (patient?.allergies || []).join(", "),
    medical_history: patient?.medical_history ?? "",
    emergency_name: patient?.emergency_contact?.name ?? "",
    emergency_phone: patient?.emergency_contact?.phone ?? "",
    emergency_relationship: patient?.emergency_contact?.relationship ?? "",
    caregiver_name: patient?.caregiver_info?.name ?? "",
    caregiver_phone: patient?.caregiver_info?.phone ?? "",
    caregiver_relationship: patient?.caregiver_info?.relationship ?? "",
    abha_id_demo: patient?.abha_id_demo ?? "",
  };
}

export function PatientForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PatientFormSchema>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: defaultsFromPatient(initial),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => onSubmit(toPatientPayload(values)))}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" error={errors.full_name?.message}>
          <Input {...register("full_name")} placeholder="Patient full name" />
        </Field>
        <Field label="Phone">
          <Input {...register("phone")} placeholder="+91..." />
        </Field>
        <Field label="Email" error={errors.email?.message}>
          <Input {...register("email")} type="email" />
        </Field>
        <Field label="Date of birth">
          <Input {...register("date_of_birth")} type="date" />
        </Field>
        <Field label="Gender">
          <Select {...register("sex")}>
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Blood group">
          <Select {...register("blood_group")}>
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Address">
          <Input {...register("address_line")} />
        </Field>
        <Field label="City">
          <Input {...register("city")} />
        </Field>
        <Field label="Chronic diseases (comma separated)">
          <Input {...register("chronic_diseases")} placeholder="Diabetes, Hypertension" />
        </Field>
        <Field label="Allergies (comma separated)">
          <Input {...register("allergies")} placeholder="Penicillin" />
        </Field>
        <Field label="ABHA ID (Demo)">
          <Input {...register("abha_id_demo")} />
        </Field>
      </div>

      <Field label="Medical history">
        <Textarea {...register("medical_history")} rows={3} />
      </Field>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Emergency contact name">
          <Input {...register("emergency_name")} />
        </Field>
        <Field label="Emergency phone">
          <Input {...register("emergency_phone")} />
        </Field>
        <Field label="Relationship">
          <Input {...register("emergency_relationship")} />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Caregiver name">
          <Input {...register("caregiver_name")} />
        </Field>
        <Field label="Caregiver phone">
          <Input {...register("caregiver_phone")} />
        </Field>
        <Field label="Caregiver relationship">
          <Input {...register("caregiver_relationship")} />
        </Field>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : initial ? "Update patient" : "Add patient"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
