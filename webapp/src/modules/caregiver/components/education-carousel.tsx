import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EducationTip, TipLocale } from "@/modules/caregiver/types";

const LOCALES: { id: TipLocale; label: string; full: string }[] = [
  { id: "en", label: "EN", full: "English" },
  { id: "hi", label: "HI", full: "Hindi" },
  { id: "gu", label: "GU", full: "Gujarati" },
];

export function EducationCarousel({ tips }: { tips: EducationTip[] }) {
  const [index, setIndex] = useState(0);
  const [locale, setLocale] = useState<TipLocale>("en");
  const tip = tips[index] ?? tips[0];

  if (!tips.length || !tip) {
    return (
      <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Caregiver Education
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          Daily tips for families
        </h2>
        <p className="mt-4 text-sm text-muted-foreground">
          Education tips will appear here once a care plan is linked.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-gradient-to-br from-white via-sky-50/40 to-teal-50/50 shadow-soft backdrop-blur">
      <div className="space-y-3 p-5 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Caregiver Education
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Daily tips for families
          </h2>
        </div>
        <div
          className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1"
          role="tablist"
          aria-label="Language"
        >
          {LOCALES.map((l) => {
            const active = locale === l.id;
            return (
              <button
                key={l.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setLocale(l.id)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl px-2 py-2 transition",
                  active
                    ? "bg-white text-teal-800 shadow-sm ring-1 ring-teal-200/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-xs font-bold">{l.label}</span>
                <span className="text-[10px] font-medium opacity-80">
                  {l.full}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${tip.id}-${locale}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="px-5 pb-5"
        >
          <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-border/50">
            <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-900">
              <BookOpen className="h-3 w-3" />
              {tip.categoryLabel}
            </span>
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
              {tip.title[locale]}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {tip.body[locale]}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between border-t border-border/50 px-5 py-4">
        <div className="flex gap-1.5">
          {tips.map((t, i) => (
            <button
              key={t.id}
              type="button"
              aria-label={`Show tip ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === index ? "w-6 bg-primary" : "w-2 bg-slate-300",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIndex((i) => (i - 1 + tips.length) % tips.length)}
          >
            Prev
          </Button>
          <Button
            size="sm"
            onClick={() => setIndex((i) => (i + 1) % tips.length)}
          >
            Next tip
          </Button>
        </div>
      </div>
    </section>
  );
}
