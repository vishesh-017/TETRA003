/** Shared Recharts tooltip chrome for consistent chart readability. */
export function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: number | string;
    color?: string;
  }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border/80 bg-card/95 px-3 py-2 text-xs shadow-lift backdrop-blur-md">
      {label != null ? (
        <p className="mb-1 font-semibold text-foreground">{String(label)}</p>
      ) : null}
      <ul className="space-y-0.5">
        {payload.map((entry) => (
          <li
            key={String(entry.dataKey)}
            className="flex items-center gap-2 text-muted-foreground"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: entry.color }}
            />
            <span>{entry.name || String(entry.dataKey)}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {typeof entry.value === "number"
                ? entry.value.toFixed(1)
                : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
