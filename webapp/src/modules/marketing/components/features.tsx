import { motion, useReducedMotion } from "framer-motion";

import { Section } from "@/modules/marketing/components/section";
import { FEATURES } from "@/modules/marketing/data";

export function FeaturesSection({
  limit,
  id = "features",
}: {
  limit?: number;
  id?: string;
}) {
  const reduce = useReducedMotion();
  const items = limit ? FEATURES.slice(0, limit) : FEATURES;

  return (
    <Section
      id={id}
      eyebrow="Platform"
      title="Everything after discharge, in one system"
      description="From AI companions to rural offline sync — designed for real care teams, not paperwork theaters."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((feature, i) => (
          <motion.article
            key={feature.title}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: Math.min(i * 0.04, 0.28) }}
            className="group rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft backdrop-blur transition hover:-translate-y-0.5 hover:shadow-lift"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
              <feature.icon className="h-5 w-5" aria-hidden />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </motion.article>
        ))}
      </div>
    </Section>
  );
}
