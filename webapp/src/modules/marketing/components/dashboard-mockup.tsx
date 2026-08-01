import { motion } from "framer-motion";

export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-xl"
      aria-hidden
    >
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-primary/25 via-transparent to-secondary/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/50 bg-card/90 shadow-lift backdrop-blur-xl dark:border-white/10">
        <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 text-xs font-medium text-muted-foreground">
            Doctor Intelligence Center
          </span>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          {[
            { label: "Active patients", value: "128", tone: "text-primary" },
            { label: "Avg recovery", value: "78", tone: "text-secondary" },
            { label: "Need attention", value: "5", tone: "text-destructive" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-border/70 bg-background/70 p-3"
            >
              <p className="text-[11px] text-muted-foreground">{kpi.label}</p>
              <p className={`mt-1 font-display text-2xl font-semibold ${kpi.tone}`}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2 px-4 pb-4">
          {[
            { name: "Asha Patel", risk: "High", score: 54, action: "Review" },
            { name: "Ravi Shah", risk: "Moderate", score: 71, action: "Follow-up" },
            { name: "Meera Desai", risk: "Low", score: 86, action: "Monitor" },
          ].map((row, i) => (
            <motion.div
              key={row.name}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + i * 0.08 }}
              className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/40 px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-semibold">{row.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Recovery {row.score} · {row.risk} risk
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                {row.action}
              </span>
            </motion.div>
          ))}
        </div>
        <div className="border-t border-border/60 px-4 py-3">
          <div className="flex h-16 items-end gap-1.5">
            {[40, 55, 48, 62, 58, 70, 74, 68, 78, 82, 76, 88].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-primary/30 to-secondary/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Cohort recovery trend · last 12 days
          </p>
        </div>
      </div>
    </motion.div>
  );
}
