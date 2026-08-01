import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Users } from "lucide-react";

import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAppLocale } from "@/i18n/locale-context";
import { PatientForm } from "@/modules/doctor/components/patient-form";
import { RiskBadge } from "@/modules/doctor/components/risk-badge";
import { useDoctorMutations, useDoctorPatients } from "@/modules/doctor/hooks";
import type { PatientDetail } from "@/modules/doctor/types";

export function PatientsPage() {
  const { t } = useAppLocale();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PatientDetail | null>(null);

  const patients = useDoctorPatients({
    search: search || undefined,
    status: status || undefined,
  });
  const mutations = useDoctorMutations();

  const rows = useMemo(() => patients.data || [], [patients.data]);

  if (patients.isLoading) {
    return <LoadingScreen fullScreen={false} variant="skeleton" />;
  }
  if (patients.isError) {
    return (
      <ErrorState
        title="Unable to load patients"
        description={patients.error.message}
        onRetry={() => void patients.refetch()}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        eyebrow="Caseload"
        title={t("nav_patients")}
        description="Link patients by HealNexus username or passport QR, then manage continuity of care."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            {t("add_patient")}
          </Button>
        }
      />

      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px]">
          <Input
            placeholder="Search name, phone, email, ABHA…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </Select>
        </CardContent>
      </Card>

      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing ? "Edit patient" : t("link_patient")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientForm
              initial={editing}
              submitting={
                mutations.createPatient.isPending || mutations.updatePatient.isPending
              }
              onCancel={() => {
                setShowForm(false);
                setEditing(null);
              }}
              onSubmit={(payload) => {
                if (editing) {
                  mutations.updatePatient.mutate(
                    { id: editing.id, body: payload },
                    {
                      onSuccess: () => {
                        setShowForm(false);
                        setEditing(null);
                      },
                    },
                  );
                } else {
                  mutations.createPatient.mutate(payload, {
                    onSuccess: () => setShowForm(false),
                  });
                }
              }}
            />
          </CardContent>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No patients yet"
          description="Link a patient with their HealNexus username or passport QR to begin monitoring."
          action={
            <Button onClick={() => setShowForm(true)}>{t("link_patient")}</Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {rows.map((patient) => (
            <Card key={patient.id}>
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{patient.full_name}</p>
                    <RiskBadge level={patient.risk_level} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {patient.age ? `${patient.age} yrs · ` : ""}
                    {patient.sex || "—"} · {patient.phone || "No phone"} · Recovery{" "}
                    {patient.recovery_score ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(patient.chronic_diseases || []).join(", ") || "No chronic diseases listed"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    to={`/doctor/patients/${patient.id}`}
                    className={cn(buttonVariants({ variant: "default", size: "sm" }))}
                  >
                    View
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(patient as PatientDetail);
                      setShowForm(true);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={mutations.archivePatient.isPending}
                    onClick={() => {
                      if (confirm(`Archive ${patient.full_name}?`)) {
                        mutations.archivePatient.mutate(patient.id);
                      }
                    }}
                  >
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={mutations.deletePatient.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          `Remove ${patient.full_name} from your panel? They can be linked again later via username/QR.`,
                        )
                      ) {
                        mutations.deletePatient.mutate(patient.id);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
