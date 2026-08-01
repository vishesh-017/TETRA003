import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  CalendarDays,
  ChartColumn,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Pill,
  Settings,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { env } from "@/config/env";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const NAV_BY_ROLE: Record<
  UserRole,
  Array<{ label: string; href: string; icon: typeof LayoutDashboard }>
> = {
  doctor: [
    { label: "Intelligence", href: "/doctor", icon: LayoutDashboard },
    { label: "Patients", href: "/doctor/patients", icon: Users },
    { label: "High Risk", href: "/doctor/high-risk", icon: Activity },
    { label: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
    { label: "Analytics", href: "/doctor/analytics", icon: ChartColumn },
    { label: "Benefits", href: "/government/benefits", icon: Sparkles },
    { label: "PM-JAY", href: "/government/pmjay", icon: Hospital },
    { label: "Hospitals", href: "/maps", icon: MapPinned },
  ],
  patient: [
    { label: "Today", href: "/patient", icon: HeartPulse },
    { label: "Care Plan", href: "/patient/care-plan", icon: Sparkles },
    { label: "Check-in", href: "/patient/check-in", icon: Activity },
    { label: "Medicines", href: "/patient/medicines", icon: Pill },
    { label: "Appointments", href: "/patient/appointments", icon: CalendarDays },
    { label: "Notifications", href: "/patient/notifications", icon: Bell },
    { label: "Recovery Score", href: "/patient/recovery-score", icon: ChartColumn },
    { label: "Passport", href: "/patient/passport", icon: Stethoscope },
    { label: "Benefits", href: "/government/benefits", icon: Hospital },
    { label: "Profile", href: "/patient/profile", icon: UserRound },
    { label: "Settings", href: "/patient/settings", icon: Settings },
    { label: "Hospitals", href: "/maps", icon: MapPinned },
  ],
  caregiver: [
    { label: "Status", href: "/caregiver", icon: LayoutDashboard },
    { label: "Alerts", href: "/caregiver/alerts", icon: Activity },
    { label: "Analytics", href: "/analytics", icon: ChartColumn },
    { label: "Hospitals", href: "/maps", icon: MapPinned },
  ],
  health_worker: [
    { label: "Home", href: "/rural", icon: LayoutDashboard },
    { label: "Screening", href: "/rural/screening", icon: HeartPulse },
    { label: "Patients", href: "/rural/patients", icon: Users },
    { label: "Visits", href: "/rural/visits", icon: CalendarDays },
    { label: "Sync", href: "/rural/sync", icon: WifiOff },
    { label: "Education", href: "/rural/education", icon: Stethoscope },
    { label: "Alerts", href: "/rural/notifications", icon: Bell },
  ],
};

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = user?.role ?? "patient";
  const items = NAV_BY_ROLE[role];

  const handleLogout = async () => {
    onClose?.();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 transition md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-soft transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <div>
            <p className="font-display text-xl font-semibold text-primary">
              {env.appName}
            </p>
            <p className="text-xs text-muted-foreground">Continuity of Care</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {items.map((item, index) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
            >
              <NavLink
                to={item.href}
                end={item.href.split("/").length <= 2}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            </motion.div>
          ))}
        </nav>

        <div className="space-y-3 border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-sidebar-accent p-3 text-xs text-muted-foreground">
            AI Care Companion assists clinicians. Doctors remain in control.
          </div>
          {user ? (
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => void handleLogout()}
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
