import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown } from "lucide-react";

import { Section } from "@/modules/marketing/components/section";
import { HOW_IT_WORKS } from "@/modules/marketing/data";

export function HowItWorksSection() {
  const reduce = useReducedMotion();

  return (
    <Section
      id="how-it-works"
      eyebrow="How it works"
      title="From discharge to durable recovery"
      description="A clear journey that keeps patients engaged and clinicians informed."
    >
      <ol className="mx-auto max-w-2xl space-y-0">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step.title} className="relative">
            <motion.div
              initial={reduce ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 rounded-3xl border border-border/80 bg-card/80 p-4 shadow-soft"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary/15 font-display text-sm font-semibold text-secondary">
                {i + 1}
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {step.detail}
                </p>
              </div>
            </motion.div>
            {i < HOW_IT_WORKS.length - 1 ? (
              <div className="flex justify-center py-2 text-muted-foreground">
                <ArrowDown className="h-4 w-4" aria-hidden />
              </div>
            ) : null}
          </li>
        ))}
      </ol>
    </Section>
  );
}
