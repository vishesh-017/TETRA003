import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ClipboardList,
  HeartPulse,
  Hospital,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { identityRepository } from "@/modules/identity/repository";
import { getStore } from "@/data/store";

export function RecoveryTimeline({ patientId }: { patientId: string }) {
  const timeline = identityRepository.getTimeline(patientId);
  const store = getStore();
  const carePlan = store.carePlans.find((c) => c.patient_id === patientId);
  const risk = store.risks.find((r) => r.patient_id === patientId);
  const recovery = store.recoveryScores.find((r) => r.patient_id === patientId);

  const stages = [
    {
      id: "admit",
      title: "Hospital Admission",
      summary:
        timeline.find((t) => t.kind === "admission")?.summary ||
        "Admission recorded in care journey",
      icon: Hospital,
    },
    {
      id: "discharge",
      title: "Discharge",
      summary:
        timeline.find((t) => t.kind === "discharge")?.summary ||
        "Awaiting discharge summary",
      icon: Stethoscope,
    },
    {
      id: "careplan",
      title: "AI Care Plan",
      summary: carePlan?.ai_summary || "Care Companion plan pending",
      icon: Sparkles,
    },
    {
      id: "checkins",
      title: "Daily Check-ins",
      summary: `${store.checkins.filter((c) => c.patient_id === patientId).length} check-ins captured`,
      icon: ClipboardList,
    },
    {
      id: "recovery",
      title: "Recovery Progress",
      summary: recovery
        ? `Recovery score ${recovery.score}/100`
        : "Recovery score computing",
      icon: HeartPulse,
    },
    {
      id: "followup",
      title: "Follow-up",
      summary:
        timeline.find((t) => t.kind === "appointment")?.summary ||
        "No follow-up logged",
      icon: CalendarDays,
    },
    {
      id: "status",
      title: "Current Status",
      summary: risk
        ? `Risk ${risk.level} · score ${risk.score}`
        : "Stable monitoring",
      icon: Activity,
    },
  ];

  return (
    <div className="relative space-y-0 pl-2">
      <div className="absolute bottom-3 left-[19px] top-3 w-px bg-gradient-to-b from-primary via-border to-transparent" />
      {stages.map((stage, i) => (
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.06 }}
          className="relative flex gap-4 pb-5 last:pb-0"
        >
          <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-background text-primary shadow-soft">
            <stage.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-3">
            <p className="font-medium">{stage.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stage.summary}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
