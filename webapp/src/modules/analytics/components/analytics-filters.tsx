import { Button } from "@/components/ui/button";
import type { AnalyticsFilters } from "@/modules/analytics/types";

export function AnalyticsFiltersBar({
  filters,
  onChange,
  onReset,
  diseases,
  doctors,
}: {
  filters: AnalyticsFilters;
  onChange: (next: AnalyticsFilters) => void;
  onReset: () => void;
  diseases: string[];
  doctors: Array<{ id: string; name: string }>;
}) {
  const set = <K extends keyof AnalyticsFilters>(
    key: K,
    value: AnalyticsFilters[K],
  ) => onChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-3xl border border-border/80 bg-card/60 p-3 shadow-soft backdrop-blur">
      <Field
        label="Age"
        value={filters.age}
        onChange={(v) => set("age", v)}
        options={[
          { value: "", label: "All ages" },
          { value: "under_50", label: "Under 50" },
          { value: "50_plus", label: "50+" },
        ]}
      />
      <Field
        label="Disease"
        value={filters.disease}
        onChange={(v) => set("disease", v)}
        options={[
          { value: "", label: "All diseases" },
          ...diseases.map((d) => ({ value: d, label: d })),
        ]}
      />
      <Field
        label="Doctor"
        value={filters.doctor}
        onChange={(v) => set("doctor", v)}
        options={[
          { value: "", label: "All doctors" },
          ...doctors.map((d) => ({ value: d.id, label: d.name })),
        ]}
      />
      <Field
        label="Risk"
        value={filters.risk}
        onChange={(v) => set("risk", v)}
        options={[
          { value: "", label: "All risk" },
          { value: "critical", label: "Critical" },
          { value: "high", label: "High" },
          { value: "moderate", label: "Moderate" },
          { value: "low", label: "Low" },
        ]}
      />
      <Button type="button" variant="ghost" onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground"
      >
        {options.map((o) => (
          <option key={o.value || "all"} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
