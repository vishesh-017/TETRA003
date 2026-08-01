import { motion } from "framer-motion";
import { Brain, QrCode, ShieldCheck } from "lucide-react";

export function HospitalDashboardVisual() {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-3 w-28 rounded-md bg-muted" />
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
          <div className="h-2 w-2 rounded-full bg-primary" />
        </div>
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="flex h-12 items-center gap-3 rounded-xl border border-border/60 bg-background/70 px-3"
          >
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2 w-1/3 rounded-full bg-muted" />
              <div className="h-2 w-1/4 rounded-full bg-muted/60" />
            </div>
            <div className="h-6 w-14 rounded-md bg-secondary/15" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function PassportCardVisual() {
  return (
    <motion.div
      whileHover={{ rotateY: 8, rotateX: 4, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="wallet-shine relative flex h-80 w-56 flex-col justify-between overflow-hidden rounded-3xl p-6 text-white shadow-lift"
    >
      <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div>
        <div className="flex items-start justify-between">
          <ShieldCheck className="h-7 w-7 opacity-90" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-85">
            Patient Passport
          </span>
        </div>
        <div className="mt-7 space-y-1.5">
          <p className="text-xs opacity-80">ABHA demo</p>
          <p className="font-mono text-lg tracking-wider">12-3456-7890</p>
        </div>
      </div>
      <div className="self-center rounded-2xl bg-white p-3 shadow-inner">
        <QrCode className="h-20 w-20 text-slate-900" />
      </div>
    </motion.div>
  );
}

export function AIEngineVisual() {
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute h-44 w-44 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-2xl border border-primary/30 bg-card shadow-lift">
        <Brain className="h-10 w-10 text-primary" />
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ rotate: 360 }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "linear",
            delay: i * 1.4,
          }}
          className="absolute h-44 w-44 rounded-full border border-dashed border-primary/25"
        >
          <div className="absolute -top-1.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-secondary shadow-soft" />
        </motion.div>
      ))}
    </div>
  );
}

export function RecoveryVisual() {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ type: "spring", bounce: 0.4 }}
        className="relative flex h-32 w-32 items-center justify-center rounded-full border-4 border-secondary/25"
      >
        <motion.div
          initial={{ height: 0 }}
          whileInView={{ height: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute bottom-0 w-full rounded-full bg-secondary/15"
        />
        <span className="z-10 font-display text-4xl font-semibold text-secondary">
          98
        </span>
      </motion.div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Recovery score
      </p>
    </div>
  );
}
