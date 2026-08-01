import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DICTIONARIES,
  LOCALE_LABELS,
  type DictKey,
} from "@/modules/rural/i18n/dictionaries";
import type { RuralLocale } from "@/modules/rural/types";

const STORAGE_KEY = "healnexus.rural.locale";

interface LocaleContextValue {
  locale: RuralLocale;
  setLocale: (locale: RuralLocale) => void;
  t: (key: DictKey) => string;
  labels: typeof LOCALE_LABELS;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): RuralLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as RuralLocale | null;
    if (raw === "en" || raw === "hi" || raw === "gu") return raw;
  } catch {
    /* ignore */
  }
  return "gu";
}

export function RuralLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<RuralLocale>(() => readLocale());

  const setLocale = useCallback((next: RuralLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: DictKey) => DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, labels: LOCALE_LABELS }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useRuralLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useRuralLocale must be used within RuralLocaleProvider");
  }
  return ctx;
}
