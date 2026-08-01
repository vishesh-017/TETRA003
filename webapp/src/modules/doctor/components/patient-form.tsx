import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { QrCode, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppLocale } from "@/i18n/locale-context";
import {
  linkPatientFormSchema,
  patientFormSchema,
  toPatientPayload,
  type LinkPatientFormSchema,
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
  if (!initial) {
    return (
      <LinkPatientForm
        submitting={submitting}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    );
  }

  return (
    <EditPatientForm
      initial={initial}
      submitting={submitting}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

function LinkPatientForm({
  submitting,
  onSubmit,
  onCancel,
}: Omit<PatientFormProps, "initial">) {
  const { t } = useAppLocale();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LinkPatientFormSchema>({
    resolver: zodResolver(linkPatientFormSchema),
    defaultValues: { username_or_qr: "" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) =>
        onSubmit({ username_or_qr: values.username_or_qr.trim() }),
      )}
    >
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
          <UserRound className="h-4 w-4 text-primary" />
          {t("link_patient")}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">{t("username_hint")}</p>
        <Field label={t("username_or_qr")} error={errors.username_or_qr?.message}>
          <div className="relative">
            <QrCode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              {...register("username_or_qr")}
              className="pl-9"
              placeholder="asha.patel or HNASHA201QRDEMO"
              autoFocus
            />
          </div>
        </Field>
        <p className="mt-2 text-xs text-muted-foreground">
          Demo: asha.patel / HNASHA201QRDEMO · ravi.shah / HNRAVI202QRDEMO ·
          meera.desai / HNMEERA203QRDEMO
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Linking…" : t("link_patient")}
        </Button>
      </div>
    </form>
  );
}

function EditPatientForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
}: PatientFormProps & { initial: PatientDetail }) {
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
        <Field label="ABHA ID (Live)">
          <Input {...register("abha_id_demo")} />
        </Field>
      </div>

      <Field label="Medical history">
        <Textarea {...register("medical_history")} rows={3} />
      </Field>

      <div className="flex flex-wrap justify-end gap-2 pt-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Update patient"}
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
