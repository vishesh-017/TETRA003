import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DICTIONARIES,
  LOCALE_CODES,
  LOCALE_LABELS,
  type AppLocale,
  type DictKey,
} from "@/i18n/dictionaries";

const STORAGE_KEY = "healnexus.app.locale";

interface LocaleContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: (key: DictKey) => string;
  labels: typeof LOCALE_LABELS;
  codes: AppLocale[];
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
    if (raw && LOCALE_CODES.includes(raw)) return raw;
  } catch {
    /* ignore */
  }
  return "en";
}

export function AppLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readLocale());

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: DictKey) => DICTIONARIES[locale][key] ?? DICTIONARIES.en[key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
      labels: LOCALE_LABELS,
      codes: LOCALE_CODES,
    }),
    [locale, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useAppLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useAppLocale must be used within AppLocaleProvider");
  }
  return ctx;
}
