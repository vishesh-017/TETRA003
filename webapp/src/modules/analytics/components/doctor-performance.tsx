import type { DoctorPerformanceRow } from "@/modules/analytics/types";

export function DoctorPerformance({
  rows,
}: {
  rows: DoctorPerformanceRow[];
}) {
  return (
    <section className="rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Doctor Performance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo only — illustrative comparisons for product walkthroughs.
          </p>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          Demo data
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="py-2 pr-3 font-medium">Doctor</th>
              <th className="py-2 pr-3 font-medium">Patients</th>
              <th className="py-2 pr-3 font-medium">Avg recovery</th>
              <th className="py-2 pr-3 font-medium">Follow-up rate</th>
              <th className="py-2 font-medium">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.doctor_id} className="border-b border-border/60">
                <td className="py-3 pr-3">
                  <p className="font-medium">{row.doctor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.specialty} · {row.hospital}
                  </p>
                </td>
                <td className="py-3 pr-3 font-display text-lg font-semibold">
                  {row.patients_managed}
                </td>
                <td className="py-3 pr-3">{row.average_recovery}</td>
                <td className="py-3 pr-3">{row.followup_rate}%</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, row.patient_engagement)}%`,
                        }}
                      />
                    </div>
                    <span>{row.patient_engagement}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
