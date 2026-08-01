import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Section } from "@/modules/marketing/components/section";
import { FAQS } from "@/modules/marketing/data";

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Questions teams ask first"
      description="Clear answers about safety, AI, offline care, and identity."
    >
      <div className="mx-auto max-w-3xl space-y-2">
        {FAQS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div
              key={item.q}
              className="rounded-2xl border border-border/80 bg-card/70 shadow-soft"
            >
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-semibold"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? null : i)}
              >
                {item.q}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
              {isOpen ? (
                <p className="border-t border-border/70 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                  {item.a}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
