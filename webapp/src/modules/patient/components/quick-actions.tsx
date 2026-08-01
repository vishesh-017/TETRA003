import {
  Activity,
  Bot,
  Hospital,
  IdCard,
  PhoneCall,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const ACTIONS = [
  {
    label: "Daily Check-in",
    href: "/patient/check-in",
    icon: Activity,
    tone: "from-primary/15 to-primary/5",
  },
  {
    label: "AI Checkup",
    href: "/patient/ai-checkup",
    icon: Bot,
    tone: "from-secondary/15 to-secondary/5",
  },
  {
    label: "AI Health Assistant",
    href: "/patient/ai-assistant",
    icon: Bot,
    tone: "from-teal-500/15 to-teal-500/5",
  },
  {
    label: "Patient Passport",
    href: "/patient/passport",
    icon: IdCard,
    tone: "from-sky-500/15 to-sky-500/5",
  },
  {
    label: "Hospital Finder",
    href: "/maps",
    icon: Hospital,
    tone: "from-emerald-500/15 to-emerald-500/5",
  },
  {
    label: "Emergency Contact",
    href: "/patient/profile#emergency",
    icon: PhoneCall,
    tone: "from-rose-500/15 to-rose-500/5",
  },
] as const;

export function QuickActions() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {ACTIONS.map((action, i) => (
        <motion.div
          key={action.href}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i }}
        >
          <Link
            to={action.href}
            className={`flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-gradient-to-br ${action.tone} p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md`}
          >
            <action.icon className="h-5 w-5 text-foreground/80" />
            <span className="font-display text-lg font-semibold leading-tight">
              {action.label}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
