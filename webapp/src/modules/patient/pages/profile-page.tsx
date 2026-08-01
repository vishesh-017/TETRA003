import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { CaregiverManager } from "@/modules/patient/components/caregiver-manager";
import {
  usePatientMutations,
  usePatientProfile,
} from "@/modules/patient/hooks";
import { profileSchema, type ProfileSchema } from "@/modules/patient/schemas";

export function ProfilePage() {
  const query = usePatientProfile();
  const { updateProfile } = usePatientMutations();
  const form = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (!query.data) return;
    const address = query.data.address as { line1?: string; city?: string } | null;
    form.reset({
      phone: query.data.phone || "",
      address_line: address?.line1 || "",
      city: address?.city || "",
      preferred_language: query.data.preferred_language || "en",
      emergency_name: query.data.emergency_contact?.name || "",
      emergency_phone: query.data.emergency_contact?.phone || "",
      emergency_relationship: query.data.emergency_contact?.relationship || "",
      notify_medicine: query.data.notification_prefs.medicine,
      notify_appointment: query.data.notification_prefs.appointment,
      notify_tips: query.data.notification_prefs.tips,
      notify_doctor: query.data.notification_prefs.doctor_messages,
    });
  }, [query.data, form]);

  if (query.isLoading)
    return <LoadingScreen label="Loading profile…" fullScreen={false} />;
  if (query.isError || !query.data)
    return (
      <ErrorState
        description="Could not load profile."
        onRetry={() => query.refetch()}
      />
    );

  const onSubmit = form.handleSubmit(async (values) => {
    await updateProfile.mutateAsync({
      phone: values.phone,
      address: { line1: values.address_line, city: values.city },
      preferred_language: values.preferred_language,
      emergency_contact: {
        name: values.emergency_name,
        phone: values.emergency_phone,
        relationship: values.emergency_relationship,
      },
      notification_prefs: {
        medicine: values.notify_medicine,
        appointment: values.notify_appointment,
        tips: values.notify_tips,
        doctor_messages: values.notify_doctor,
      },
    });
  });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit contact preferences. Medical fields stay doctor-controlled.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Read-only medical summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-muted-foreground">Name</p>
            <p className="font-medium">{query.data.full_name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Blood group</p>
            <p className="font-medium">{query.data.blood_group || "—"}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Allergies</p>
            <p className="font-medium">
              {query.data.allergies.join(", ") || "None"}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-muted-foreground">Chronic conditions</p>
            <p className="font-medium">
              {query.data.chronic_diseases.join(", ") || "—"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div id="caregivers">
        <CaregiverManager />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editable details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Phone">
                <Input {...form.register("phone")} />
              </Field>
              <Field label="Preferred language">
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                  {...form.register("preferred_language")}
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="gu">Gujarati</option>
                </select>
              </Field>
              <Field label="Address">
                <Input {...form.register("address_line")} />
              </Field>
              <Field label="City">
                <Input {...form.register("city")} />
              </Field>
            </div>

            <div id="emergency" className="space-y-3 rounded-2xl bg-muted/40 p-4">
              <p className="font-medium">Emergency contact</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Name">
                  <Input {...form.register("emergency_name")} />
                </Field>
                <Field label="Phone">
                  <Input {...form.register("emergency_phone")} />
                </Field>
                <Field label="Relationship">
                  <Input {...form.register("emergency_relationship")} />
                </Field>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium">Notification preferences</p>
              {(
                [
                  ["notify_medicine", "Medicine reminders"],
                  ["notify_appointment", "Appointment reminders"],
                  ["notify_tips", "Health tips"],
                  ["notify_doctor", "Doctor messages"],
                ] as const
              ).map(([name, label]) => (
                <label key={name} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register(name)} />
                  {label}
                </label>
              ))}
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? "Saving…" : "Save profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
