import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EducationTip, TipLocale } from "@/modules/caregiver/types";

const LOCALES: { id: TipLocale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "hi", label: "HI" },
  { id: "gu", label: "GU" },
  { id: "mr", label: "MR" },
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
          Education tips appear here from the doctor-approved AI Care Companion
          plan (diet, activity, warning signs, and next steps).
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-soft backdrop-blur">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Caregiver Education
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
            Daily tips for families
          </h2>
        </div>
        <div className="flex gap-1 rounded-full bg-slate-100 p-1">
          {LOCALES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLocale(l.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition",
                locale === l.id
                  ? "bg-white text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${tip.id}-${locale}`}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.22 }}
          className="rounded-2xl bg-gradient-to-br from-sky-50 to-teal-50/50 p-5"
        >
          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-sky-800 shadow-sm">
            {tip.categoryLabel}
          </span>
          <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
            {tip.title[locale]}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {tip.body[locale]}
          </p>
        </motion.div>
      </AnimatePresence>

      <div className="mt-4 flex items-center justify-between">
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
