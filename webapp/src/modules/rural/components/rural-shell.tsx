import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Home,
  RefreshCw,
  Stethoscope,
  Users,
} from "lucide-react";

import { RuralLocaleProvider, useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { useOnlineStatus } from "@/modules/rural/hooks";
import { cn } from "@/lib/utils";
import type { DictKey } from "@/modules/rural/i18n/dictionaries";

const NAV: Array<{ to: string; icon: typeof Home; key: DictKey; end?: boolean }> =
  [
    { to: "/rural", icon: Home, key: "dashboard", end: true },
    { to: "/rural/screening", icon: Stethoscope, key: "screening" },
    { to: "/rural/patients", icon: Users, key: "patients" },
    { to: "/rural/visits", icon: CalendarDays, key: "visits" },
    { to: "/rural/education", icon: BookOpen, key: "education" },
    { to: "/rural/sync", icon: RefreshCw, key: "sync" },
    { to: "/rural/notifications", icon: Bell, key: "notifications" },
  ];

function ShellInner() {
  const { t, locale, setLocale, labels } = useRuralLocale();
  const online = useOnlineStatus();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-lg flex-col gap-3 pb-24">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-label">Field care</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("appName")}
          </h1>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              online
                ? "bg-secondary/15 text-secondary"
                : "bg-warning/20 text-warning-foreground",
            )}
          >
            {online ? t("online") : t("offline")}
          </span>
          <select
            aria-label={t("language")}
            className="h-9 rounded-xl border border-input bg-card px-2 text-sm"
            value={locale}
            onChange={(e) =>
              setLocale(e.target.value as "en" | "hi" | "gu")
            }
          >
            {(Object.keys(labels) as Array<"en" | "hi" | "gu">).map((code) => (
              <option key={code} value={code}>
                {labels[code]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Outlet />

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-card/90 px-2 py-2 shadow-lift backdrop-blur-xl md:static md:rounded-3xl md:border md:shadow-soft"
        aria-label="Rural navigation"
      >
        <div className="mx-auto flex max-w-lg justify-between gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-2 text-[10px] font-semibold transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted/60",
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden />
              <span className="truncate">{t(item.key)}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export function RuralShell() {
  return (
    <RuralLocaleProvider>
      <ShellInner />
    </RuralLocaleProvider>
  );
}
