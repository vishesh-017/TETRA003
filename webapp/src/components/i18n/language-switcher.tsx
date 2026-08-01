import { useAppLocale } from "@/i18n/locale-context";
import type { AppLocale } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, codes, t } = useAppLocale();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className={cn(
        "inline-flex items-center rounded-full border border-[#0F172A]/10 bg-white p-1 shadow-sm",
        compact ? "gap-0.5" : "gap-1",
        className,
      )}
    >
      {codes.map((code) => {
        const active = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code as AppLocale)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold transition",
              active
                ? "bg-[#0F766E] text-white shadow-sm"
                : "text-[#64748B] hover:text-[#0F172A]",
            )}
            aria-pressed={active}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
