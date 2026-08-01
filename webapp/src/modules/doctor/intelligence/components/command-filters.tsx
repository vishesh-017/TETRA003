import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { IntelligenceFilters } from "@/modules/doctor/intelligence/types";

export function CommandFilters({
  filters,
  onChange,
  onReset,
  diseases,
  healthWorkers,
}: {
  filters: IntelligenceFilters;
  onChange: (next: IntelligenceFilters) => void;
  onReset: () => void;
  diseases: string[];
  healthWorkers: string[];
}) {
  const set = <K extends keyof IntelligenceFilters>(
    key: K,
    value: IntelligenceFilters[K],
  ) => onChange({ ...filters, [key]: value });

  return (
    <div className="rounded-3xl border border-border/80 bg-card/70 p-4 shadow-soft backdrop-blur">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filters.search}
          onChange={(e) => set("search", e.target.value)}
          placeholder="Search patient, ABHA, phone, disease, medicine…"
          className="flex h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-3 text-sm"
        />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <Select
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
        <Select
          label="Disease"
          value={filters.disease}
          onChange={(v) => set("disease", v)}
          options={[
            { value: "", label: "All diseases" },
            ...diseases.map((d) => ({ value: d, label: d })),
          ]}
        />
        <Select
          label="Age"
          value={filters.age}
          onChange={(v) => set("age", v)}
          options={[
            { value: "", label: "All ages" },
            { value: "under_50", label: "Under 50" },
            { value: "50_plus", label: "50+" },
          ]}
        />
        <Select
          label="Recovery"
          value={filters.recovery}
          onChange={(v) => set("recovery", v)}
          options={[
            { value: "", label: "All scores" },
            { value: "low", label: "< 60" },
            { value: "mid", label: "60–79" },
            { value: "high", label: "80+" },
          ]}
        />
        <Select
          label="Appointment"
          value={filters.appointment}
          onChange={(v) => set("appointment", v)}
          options={[
            { value: "", label: "Any appt" },
            { value: "has_upcoming", label: "Has upcoming" },
            { value: "none", label: "None scheduled" },
          ]}
        />
        <Select
          label="Health worker"
          value={filters.health_worker}
          onChange={(v) => set("health_worker", v)}
          options={[
            { value: "", label: "Any HW" },
            ...healthWorkers.map((h) => ({ value: h, label: h })),
          ]}
        />
        <Select
          label="Caregiver"
          value={filters.caregiver}
          onChange={(v) => set("caregiver", v)}
          options={[
            { value: "", label: "Any" },
            { value: "yes", label: "Has caregiver" },
            { value: "no", label: "No caregiver" },
          ]}
        />
      </div>

      <div className="mt-3 flex justify-end">
        <Button variant="ghost" size="sm" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </div>
  );
}

function Select({
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
    <label className="block space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <select
        className="flex h-10 w-full rounded-xl border border-input bg-background px-2 text-sm text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value || o.label} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
