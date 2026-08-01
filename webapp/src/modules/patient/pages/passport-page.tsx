import { QrCode } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { usePatientPassport } from "@/modules/patient/hooks";

export function PassportPage() {
  const query = usePatientPassport();

  if (query.isLoading)
    return <LoadingScreen label="Loading passport…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load patient passport."
        onRetry={() => query.refetch()}
      />
    );

  const p = query.data;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Patient Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Share this with emergency teams. Medical fields are doctor-controlled.
        </p>
      </div>

      <Card className="overflow-hidden bg-gradient-to-br from-primary/10 via-card to-secondary/10">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>HealNexus Passport</CardTitle>
          <div className="flex h-24 w-24 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-background">
            <QrCode className="h-12 w-12 text-primary" />
            <span className="mt-1 text-[10px] text-muted-foreground">{p.qr_token}</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Item label="Blood group" value={p.blood_group} />
          <Item label="ABHA Demo ID" value={p.abha_id_demo} />
          <Item
            label="Allergies"
            value={p.allergies.length ? p.allergies.join(", ") : "None"}
          />
          <Item
            label="Emergency contact"
            value={
              p.emergency_contact
                ? `${p.emergency_contact.name || ""} ${p.emergency_contact.phone || ""}`.trim()
                : "—"
            }
          />
          <div className="sm:col-span-2">
            <Item label="Medical history" value={p.medical_history} />
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Current medicines</p>
            <ul className="mt-1 space-y-1 text-sm font-medium">
              {p.current_medicines.map((m) => (
                <li key={m.name}>
                  {m.name}
                  {m.dose ? ` · ${m.dose}` : ""}
                  {m.time ? ` · ${m.time}` : ""}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Item({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
