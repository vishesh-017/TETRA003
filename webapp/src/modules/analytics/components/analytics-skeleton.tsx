export function AnalyticsSkeleton() {
  return (
    <div className="mx-auto flex max-w-[1400px] animate-pulse flex-col gap-5 pb-10">
      <div className="h-20 rounded-3xl bg-muted/60" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-28 rounded-3xl bg-muted/50" />
        ))}
      </div>
      <div className="h-14 rounded-3xl bg-muted/40" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-80 rounded-3xl bg-muted/45" />
        <div className="h-80 rounded-3xl bg-muted/45" />
      </div>
    </div>
  );
}
