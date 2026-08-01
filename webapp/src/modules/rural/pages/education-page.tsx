import { motion } from "framer-motion";

import { useEducationCards } from "@/modules/rural/hooks";
import { useRuralLocale } from "@/modules/rural/i18n/locale-context";

export function RuralEducationPage() {
  const { t } = useRuralLocale();
  const cards = useEducationCards();

  return (
    <div className="space-y-3">
      <h2 className="font-display text-xl font-semibold">{t("education")}</h2>
      <p className="text-sm text-muted-foreground">{t("tips")}</p>
      {cards.map((card, i) => (
        <motion.article
          key={card.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="rounded-3xl border border-border bg-card p-5 shadow-soft"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {card.topic.replaceAll("_", " ")}
          </p>
          <h3 className="mt-1 font-display text-xl font-semibold">
            {card.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {card.body}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {card.bullets.map((b) => (
              <li key={b} className="rounded-xl bg-muted/50 px-3 py-2">
                • {b}
              </li>
            ))}
          </ul>
        </motion.article>
      ))}
    </div>
  );
}
