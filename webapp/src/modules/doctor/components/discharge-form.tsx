import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  dischargeFormSchema,
  type DischargeFormSchema,
} from "@/modules/doctor/schemas";
import type { DischargeSummary } from "@/modules/doctor/types";

interface DischargeFormProps {
  initial?: DischargeSummary | null;
  saving?: boolean;
  finalizing?: boolean;
  onSaveDraft: (values: DischargeFormSchema) => void;
  onFinalize?: () => void;
}

export function DischargeForm({
  initial,
  saving,
  finalizing,
  onSaveDraft,
  onFinalize,
}: DischargeFormProps) {
  const locked = initial?.status === "finalized";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DischargeFormSchema>({
    resolver: zodResolver(dischargeFormSchema),
    defaultValues: {
      diagnosis_text: initial?.diagnosis_text ?? "",
      medicines_text: initial?.medicines_text ?? "",
      doctor_notes: initial?.doctor_notes ?? "",
      diet_advice: initial?.diet_advice ?? "",
      exercise_advice: initial?.exercise_advice ?? "",
      restrictions: initial?.restrictions ?? "",
      special_instructions: initial?.special_instructions ?? "",
      follow_up_date: initial?.follow_up_date ?? "",
      discharge_date: initial?.discharge_date ?? "",
      hospital_name: initial?.hospital_name ?? "Civil Hospital Ahmedabad",
      file_url: initial?.file_url ?? "",
    },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSaveDraft)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>Diagnosis</Label>
          <Textarea {...register("diagnosis_text")} disabled={locked} />
          {errors.diagnosis_text ? (
            <p className="text-xs text-destructive">{errors.diagnosis_text.message}</p>
          ) : null}
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Medicines (doctor-prescribed — one per line)</Label>
          <Textarea
            {...register("medicines_text")}
            disabled={locked}
            placeholder={"Metformin 500mg — twice daily\nAtorvastatin 10mg — once nightly"}
          />
          {errors.medicines_text ? (
            <p className="text-xs text-destructive">{errors.medicines_text.message}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Doctor notes</Label>
          <Textarea {...register("doctor_notes")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Special instructions</Label>
          <Textarea {...register("special_instructions")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Diet advice</Label>
          <Textarea {...register("diet_advice")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Exercise advice</Label>
          <Textarea {...register("exercise_advice")} disabled={locked} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label>Restrictions</Label>
          <Textarea {...register("restrictions")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Discharge date</Label>
          <Input type="date" {...register("discharge_date")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Follow-up date</Label>
          <Input type="date" {...register("follow_up_date")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>Hospital</Label>
          <Input {...register("hospital_name")} disabled={locked} />
        </div>
        <div className="space-y-2">
          <Label>PDF URL (optional upload link)</Label>
          <Input {...register("file_url")} disabled={locked} placeholder="https://..." />
        </div>
      </div>

      {!locked ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="submit" variant="outline" disabled={saving}>
            {saving ? "Saving…" : "Save draft"}
          </Button>
          {initial?.id && onFinalize ? (
            <Button
              type="button"
              disabled={finalizing}
              onClick={onFinalize}
            >
              {finalizing ? "Finalizing…" : "Finalize & run Care Companion"}
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          This discharge is finalized. AI Care Companion draft is available for doctor review.
        </p>
      )}
    </form>
  );
}
