import { Outlet } from "react-router-dom";

import { RuralLocaleProvider, useRuralLocale } from "@/modules/rural/i18n/locale-context";
import { useOnlineStatus } from "@/modules/rural/hooks";
import { cn } from "@/lib/utils";

function ShellInner() {
  const { t, locale, setLocale, labels } = useRuralLocale();
  const online = useOnlineStatus();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-3xl flex-col gap-3 pb-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-label">Field care</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("appName")}
          </h1>
          <p className="text-xs text-muted-foreground">
            Camps & verified screening, patient map, offline sync, education.
          </p>
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
