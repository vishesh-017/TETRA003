import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  CalendarDays,
  ChartColumn,
  ChevronsLeft,
  ClipboardList,
  HeartHandshake,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LogOut,
  MapPinned,
  Pill,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  UserRound,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { HealNexusLogo, HealNexusMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useShell } from "@/contexts/shell-context";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

type NavItem = {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = {
  id: string;
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: Record<UserRole, NavGroup[]> = {
  doctor: [
    {
      id: "command",
      label: "Command",
      items: [
        { label: "Intelligence", href: "/doctor", icon: LayoutDashboard },
        { label: "Patients", href: "/doctor/patients", icon: Users },
        { label: "High Risk", href: "/doctor/high-risk", icon: Activity },
        { label: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
        {
          label: "Investigations",
          href: "/doctor/investigations",
          icon: ClipboardList,
        },
        {
          label: "Analytics",
          href: "/doctor/analytics",
          icon: ChartColumn,
        },
      ],
    },
  ],
  patient: [
    {
      id: "today",
      label: "Care",
      items: [
        { label: "Today", href: "/patient", icon: HeartPulse },
        { label: "Care Plan", href: "/patient/care-plan", icon: Sparkles },
        {
          label: "Investigations",
          href: "/patient/investigations",
          icon: ClipboardList,
        },
        { label: "Check-in", href: "/patient/check-in", icon: Activity },
        { label: "Medicines", href: "/patient/medicines", icon: Pill },
        {
          label: "Appointments",
          href: "/patient/appointments",
          icon: CalendarDays,
        },
        { label: "Recovery", href: "/patient/recovery-score", icon: ChartColumn },
      ],
    },
    {
      id: "identity",
      label: "Identity",
      items: [
        { label: "Passport", href: "/patient/passport", icon: Stethoscope },
        { label: "Benefits", href: "/government/benefits", icon: Sparkles },
        { label: "PM-JAY", href: "/government/pmjay", icon: Hospital },
        { label: "Hospitals", href: "/maps", icon: MapPinned },
        {
          label: "Notifications",
          href: "/patient/notifications",
          icon: Bell,
        },
        {
          label: "Caregivers",
          href: "/patient/profile#caregivers",
          icon: HeartHandshake,
        },
        { label: "Profile", href: "/patient/profile", icon: UserRound },
        { label: "Settings", href: "/patient/settings", icon: Settings },
      ],
    },
  ],
  caregiver: [
    {
      id: "care",
      label: "Family Care",
      items: [
        { label: "Dashboard", href: "/caregiver", icon: LayoutDashboard },
        { label: "Family Members", href: "/caregiver/family", icon: Users },
        { label: "Today's Care", href: "/caregiver/today", icon: HeartPulse },
        { label: "Medicines", href: "/caregiver/medicines", icon: Pill },
        { label: "Health Trends", href: "/caregiver/trends", icon: ChartColumn },
        {
          label: "Appointments",
          href: "/caregiver/appointments",
          icon: CalendarDays,
        },
      ],
    },
    {
      id: "safety",
      label: "Safety",
      items: [
        { label: "Passport", href: "/caregiver/passport", icon: Stethoscope },
        { label: "Hospitals", href: "/caregiver/hospitals", icon: MapPinned },
        { label: "Emergency", href: "/caregiver/emergency", icon: ShieldAlert },
        { label: "Alerts", href: "/caregiver/alerts", icon: Bell },
        { label: "Settings", href: "/caregiver/settings", icon: Settings },
      ],
    },
  ],
  health_worker: [
    {
      id: "field",
      label: "Field",
      items: [
        { label: "Home", href: "/rural", icon: LayoutDashboard },
        { label: "Screening", href: "/rural/screening", icon: HeartPulse },
        { label: "Patients", href: "/rural/patients", icon: Users },
        { label: "Visits", href: "/rural/visits", icon: CalendarDays },
        { label: "Sync", href: "/rural/sync", icon: WifiOff },
        { label: "Education", href: "/rural/education", icon: Stethoscope },
        { label: "Alerts", href: "/rural/notifications", icon: Bell },
      ],
    },
  ],
};

export function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { sidebarCollapsed, mobileOpen, setMobileOpen, toggleCollapsed } =
    useShell();
  const role = user?.role ?? "patient";
  const groups = NAV_GROUPS[role];
  const collapsed = sidebarCollapsed;

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1090] bg-foreground/35 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        ) : null}
      </AnimatePresence>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[1100] flex h-dvh max-h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-soft backdrop-blur-xl transition-[width,transform] duration-300 ease-out md:static md:z-auto md:translate-x-0",
          collapsed ? "md:w-[76px]" : "md:w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
        aria-label="Main navigation"
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-3",
            collapsed ? "md:justify-center" : "justify-between",
          )}
        >
          <div className={cn(collapsed && "md:hidden")}>
            <HealNexusLogo showTagline />
          </div>
          <div className={cn("hidden", collapsed && "md:block")}>
            <HealNexusMark size={32} />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-3">
          {groups.map((group) => (
            <div key={group.id}>
              <p
                className={cn(
                  "mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
                  collapsed && "md:sr-only",
                )}
              >
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    end={item.href.split("/").length <= 2}
                    title={item.label}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        collapsed && "md:justify-center md:px-2",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className={cn(collapsed && "md:sr-only")}>
                      {item.label}
                    </span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
          <p
            className={cn(
              "rounded-xl bg-sidebar-accent px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground",
              collapsed && "md:hidden",
            )}
          >
            AI assists. Clinicians decide.
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="hidden md:inline-flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title="Toggle sidebar ([)"
            >
              <ChevronsLeft
                className={cn(
                  "h-4 w-4 transition-transform",
                  collapsed && "rotate-180",
                )}
              />
            </Button>
            {user ? (
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start gap-2",
                  collapsed && "md:flex-none md:justify-center md:px-0",
                )}
                onClick={() => void handleLogout()}
                aria-label="Logout"
              >
                <LogOut className="h-4 w-4" />
                <span className={cn(collapsed && "md:sr-only")}>Logout</span>
              </Button>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
