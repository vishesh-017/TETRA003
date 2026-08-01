import { motion } from "framer-motion";
import {
  Ambulance,
  Hospital,
  Phone,
  PhoneCall,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useCaregiver } from "@/modules/caregiver/context";

const actions = [
  {
    key: "doctor",
    label: "Call Doctor",
    icon: PhoneCall,
    hrefKey: "doctorPhone" as const,
    className: "from-sky-500 to-blue-600",
  },
  {
    key: "video",
    label: "Video Consultation",
    icon: Video,
    hrefKey: "videoLink" as const,
    className: "from-teal-500 to-emerald-600",
  },
  {
    key: "emergency",
    label: "Emergency Contact",
    icon: Phone,
    hrefKey: "emergencyPhone" as const,
    className: "from-amber-500 to-orange-600",
  },
  {
    key: "hospital",
    label: "Nearest Hospital",
    icon: Hospital,
    hrefKey: "hospitalPhone" as const,
    className: "from-slate-600 to-slate-800",
  },
  {
    key: "ambulance",
    label: "Ambulance",
    icon: Ambulance,
    hrefKey: "ambulance" as const,
    className: "from-rose-500 to-red-600",
  },
];

export function EmergencyPanel({ compact = false }: { compact?: boolean }) {
  const { emergency, selected } = useCaregiver();

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-rose-100 bg-gradient-to-br from-rose-50 via-white to-orange-50/40 p-5 shadow-soft",
        compact && "p-4",
      )}
    >
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700/80">
          Emergency Center
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Help is one tap away
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          For {selected.name} · {emergency.hospitalName}
        </p>
      </div>

      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3")}>
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <motion.a
              key={action.key}
              href={emergency[action.hrefKey]}
              target={action.hrefKey === "videoLink" ? "_blank" : undefined}
              rel={action.hrefKey === "videoLink" ? "noreferrer" : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "flex min-h-[72px] items-center gap-3 rounded-2xl bg-gradient-to-br px-4 py-3 text-white shadow-lift",
                action.className,
              )}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold leading-tight">{action.label}</span>
            </motion.a>
          );
        })}
      </div>
    </section>
  );
}
