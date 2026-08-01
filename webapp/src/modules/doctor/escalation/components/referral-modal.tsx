import { useEffect, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAppLocale } from "@/i18n/locale-context";
import type {
  PatientRiskData,
  ReferralPayload,
} from "@/modules/doctor/escalation/types";

const SPECIALTIES = [
  "Cardiology",
  "Endocrinology",
  "Nephrology",
  "Internal Medicine",
  "Neurology",
  "Pulmonology",
];

interface ReferralModalProps {
  open: boolean;
  risk: PatientRiskData | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: ReferralPayload) => void;
}

export function ReferralModal({
  open,
  risk,
  submitting,
  onClose,
  onSubmit,
}: ReferralModalProps) {
  const { t } = useAppLocale();
  const [reason, setReason] = useState("");
  const [urgency, setUrgency] =
    useState<ReferralPayload["urgency"]>("urgent");
  const [specialty, setSpecialty] = useState("Cardiology");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open || !risk) return;
    setReason(risk.explanation);
    setSpecialty(risk.referral.specialty || "Internal Medicine");
    setUrgency(
      risk.risk_level === "critical"
        ? "emergency"
        : risk.risk_level === "high"
          ? "urgent"
          : "routine",
    );
    setNotes("");
  }, [open, risk]);

  if (!open || !risk) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold">
              {t("refer_patient")}
            </h3>
            <p className="text-sm text-muted-foreground">{risk.full_name}</p>
          </div>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit({
              patient_id: risk.patient_id,
              clinical_reason: reason.trim(),
              urgency,
              specialty,
              notes: notes.trim(),
            });
          }}
        >
          <div className="space-y-1.5">
            <Label>{t("clinical_reason")}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t("urgency")}</Label>
              <Select
                value={urgency}
                onChange={(e) =>
                  setUrgency(e.target.value as ReferralPayload["urgency"])
                }
              >
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("specialty")}</Label>
              <Select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t("notes")}</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional handoff notes"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !reason.trim()}>
              {submitting ? `${t("submit")}…` : t("submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
