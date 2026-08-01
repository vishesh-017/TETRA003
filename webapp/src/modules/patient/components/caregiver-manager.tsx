import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Copy, HeartHandshake, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  usePatientCaregivers,
  usePatientCaregiverMutations,
} from "@/modules/patient/hooks";

const inviteSchema = z.object({
  name: z.string().min(2, "Enter caregiver name"),
  phone: z.string().min(8, "Enter a valid phone"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  relationship: z.string().min(2, "e.g. Daughter, Son, Spouse"),
  makePrimary: z.boolean(),
  view_medicines: z.boolean(),
  view_vitals: z.boolean(),
  view_appointments: z.boolean(),
  receive_alerts: z.boolean(),
  emergency_access: z.boolean(),
});

type InviteForm = z.infer<typeof inviteSchema>;

export function CaregiverManager() {
  const list = usePatientCaregivers();
  const { addCaregiver, revokeCaregiver, setPrimaryCaregiver } =
    usePatientCaregiverMutations();
  const [open, setOpen] = useState(false);

  const form = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      relationship: "Daughter",
      makePrimary: true,
      view_medicines: true,
      view_vitals: true,
      view_appointments: true,
      receive_alerts: true,
      emergency_access: true,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const result = await addCaregiver.mutateAsync({
        name: values.name,
        phone: values.phone,
        email: values.email || undefined,
        relationship: values.relationship,
        makePrimary: values.makePrimary,
        permissions: {
          view_medicines: values.view_medicines,
          view_vitals: values.view_vitals,
          view_appointments: values.view_appointments,
          receive_alerts: values.receive_alerts,
          emergency_access: values.emergency_access,
        },
      });
      toast.success("Caregiver arranged", {
        description: result.message,
        duration: 8000,
      });
      form.reset({
        ...form.getValues(),
        name: "",
        phone: "",
        email: "",
      });
      setOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not add caregiver",
      );
    }
  });

  const caregivers = list.data ?? [];

  return (
    <Card className="overflow-hidden border-teal-100/80">
      <CardHeader className="bg-gradient-to-br from-teal-50/80 to-sky-50/40">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-teal-800/80">
              <HeartHandshake className="h-3.5 w-3.5" />
              Family care circle
            </p>
            <CardTitle className="mt-1 font-display text-2xl">
              My caregivers
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Invite someone you trust. They get a personal caregiver workspace for
              your medicines, vitals, and alerts.
            </p>
          </div>
          <Button type="button" onClick={() => setOpen((v) => !v)}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            {open ? "Close" : "Add caregiver"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        {open ? (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={onSubmit}
            className="space-y-4 rounded-2xl border border-border bg-slate-50/70 p-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Full name" error={form.formState.errors.name?.message}>
                <Input placeholder="Priya Patel" {...form.register("name")} />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input placeholder="+91 98765 88888" {...form.register("phone")} />
              </Field>
              <Field
                label="Email (optional)"
                error={form.formState.errors.email?.message}
              >
                <Input
                  placeholder="priya@email.com"
                  {...form.register("email")}
                />
              </Field>
              <Field
                label="Relationship"
                error={form.formState.errors.relationship?.message}
              >
                <Input
                  placeholder="Daughter / Son / Spouse"
                  {...form.register("relationship")}
                />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">What they can access</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(
                  [
                    ["view_medicines", "Medicines"],
                    ["view_vitals", "Vitals & check-ins"],
                    ["view_appointments", "Appointments"],
                    ["receive_alerts", "Alerts & escalations"],
                    ["emergency_access", "Emergency contacts"],
                    ["makePrimary", "Set as primary caregiver"],
                  ] as const
                ).map(([key, label]) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-border/70"
                  >
                    <input type="checkbox" {...form.register(key)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" disabled={addCaregiver.isPending}>
              {addCaregiver.isPending ? "Creating arrangement…" : "Create arrangement"}
            </Button>
          </motion.form>
        ) : null}

        {caregivers.length === 0 ? (
          <p className="rounded-2xl bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
            No caregivers linked yet. Add a family member so they can support your
            recovery after discharge.
          </p>
        ) : (
          <ul className="space-y-3">
            {caregivers.map((cg) => (
              <li
                key={cg.id}
                className="rounded-2xl border border-border/80 bg-white p-4 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{cg.caregiver_name}</p>
                      {cg.is_primary ? (
                        <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-900">
                          Primary
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                        {cg.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {cg.relationship} · {cg.caregiver_phone}
                      {cg.caregiver_email ? ` · ${cg.caregiver_email}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!cg.is_primary ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          setPrimaryCaregiver.mutate(cg.id, {
                            onSuccess: () =>
                              toast.success("Primary caregiver updated"),
                          })
                        }
                      >
                        Make primary
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        await navigator.clipboard.writeText(cg.invite_code);
                        toast.message("Invite code copied", {
                          description: cg.invite_code,
                        });
                      }}
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      {cg.invite_code}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        revokeCaregiver.mutate(cg.id, {
                          onSuccess: () => toast.message("Caregiver removed"),
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 flex items-start gap-2 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-950">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  They sign in with invite code{" "}
                  <span className="font-mono font-semibold">{cg.invite_code}</span>{" "}
                  on the login page → Caregiver invite.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(cg.permissions)
                    .filter(([, on]) => on)
                    .map(([key]) => (
                      <span
                        key={key}
                        className={cn(
                          "rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground",
                        )}
                      >
                        {key.replaceAll("_", " ")}
                      </span>
                    ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
