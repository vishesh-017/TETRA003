import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getStore, IDS, todayKey } from "@/data/store";
import { investigationRepository } from "@/modules/investigations/repository";
import type { InvestigationPriority } from "@/data/store/types";

export function AddInvestigationForm({
  patientId,
  requestedBy,
  onCreated,
}: {
  patientId: string;
  requestedBy: "doctor" | "patient";
  onCreated?: () => void;
}) {
  const [name, setName] = useState("");
  const [due, setDue] = useState(todayKey());
  const [priority, setPriority] = useState<InvestigationPriority>("routine");
  const [purpose, setPurpose] = useState("");
  const [busy, setBusy] = useState(false);

  const doctorId =
    getStore().relationships.find(
      (r) => r.patient_id === patientId && r.status === "active",
    )?.doctor_id ||
    getStore().doctors[0]?.id ||
    IDS.doctor;

  const submit = () => {
    setBusy(true);
    try {
      investigationRepository.createForPatient({
        patientId,
        doctorId,
        name,
        due_date: due,
        priority,
        purpose,
        requestedBy,
      });
      toast.success(
        requestedBy === "doctor"
          ? "Investigation ordered"
          : "Investigation requested — your doctor can review",
      );
      setName("");
      setPurpose("");
      setPriority("routine");
      onCreated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add investigation");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {requestedBy === "doctor"
            ? "Order investigation"
            : "Request / add investigation"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Test name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HbA1c / CBC / Creatinine"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Due date</Label>
            <Input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as InvestigationPriority)
              }
            >
              <option value="routine">Routine</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Purpose / notes</Label>
          <Textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={2}
            placeholder="Why this test is needed"
          />
        </div>
        <Button disabled={busy || !name.trim()} onClick={submit}>
          {requestedBy === "doctor" ? "Order test" : "Add investigation"}
        </Button>
      </CardContent>
    </Card>
  );
}
