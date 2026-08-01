import { ErrorState } from "@/components/feedback/error-state";
import { LoadingScreen } from "@/components/feedback/loading-screen";
import { MedicineCard } from "@/modules/patient/components/medicine-card";
import {
  usePatientMedicines,
  usePatientMutations,
} from "@/modules/patient/hooks";

export function MedicinesPage() {
  const meds = usePatientMedicines();
  const { markMedicine } = usePatientMutations();

  if (meds.isLoading) return <LoadingScreen label="Loading medicines…" fullScreen={false} />;
  if (meds.isError || !meds.data)
    return (
      <ErrorState
        description="Could not load medicine reminders."
        onRetry={() => meds.refetch()}
      />
    );

  const scoreUnits = meds.data.reduce((sum, m) => {
    if (m.today_status === "completed") return sum + 1;
    if (m.today_status === "late") return sum + 0.7;
    return sum;
  }, 0);
  const adherence = meds.data.length
    ? Math.round((scoreUnits / meds.data.length) * 100)
    : 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Medicine Reminder</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Today's adherence: <span className="font-medium text-primary">{adherence}%</span>
        </p>
      </div>
      <div className="space-y-3">
        {meds.data.map((medicine) => (
          <MedicineCard
            key={medicine.id}
            medicine={medicine}
            busy={markMedicine.isPending}
            onTaken={() =>
              markMedicine.mutate({ medicineId: medicine.id, status: "taken" })
            }
            onLate={() =>
              markMedicine.mutate({ medicineId: medicine.id, status: "late" })
            }
            onSkipped={() =>
              markMedicine.mutate({ medicineId: medicine.id, status: "skipped" })
            }
          />
        ))}
      </div>
    </div>
  );
}
