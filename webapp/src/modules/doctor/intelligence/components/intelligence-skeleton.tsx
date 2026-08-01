export function IntelligenceSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-10 w-72 rounded-xl bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-3xl bg-muted" />
        ))}
      </div>
      <div className="h-28 rounded-3xl bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-3xl bg-muted" />
          ))}
        </div>
        <div className="h-[420px] rounded-3xl bg-muted" />
      </div>
    </div>
  );
}
