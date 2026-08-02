import { motion } from "framer-motion";
import {
  Apple,
  BookOpen,
  Brain,
  Droplets,
  Heart,
  Languages,
  Sparkles,
  Stethoscope,
  Utensils,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import {
  getEducationLessons,
  getEducationTopics,
} from "@/modules/education/catalog";
import type {
  EduAudience,
  EduLesson,
  EduLocale,
  EduTopicId,
} from "@/modules/education/types";
import { getEducationCards } from "@/modules/rural/services/education.service";
import type { RuralLocale } from "@/modules/rural/types";

const LOCALES: { id: EduLocale; label: string; full: string }[] = [
  { id: "en", label: "EN", full: "English" },
  { id: "hi", label: "HI", full: "Hindi" },
  { id: "gu", label: "GU", full: "Gujarati" },
];

const TOPIC_ICONS: Partial<Record<EduTopicId, typeof Sparkles>> = {
  all: Sparkles,
  diabetes: Droplets,
  bp: Heart,
  kidneys: Droplets,
  heart: Heart,
  stroke: Brain,
  habits: Apple,
  diet: Utensils,
  medicine: Stethoscope,
  emergency: Stethoscope,
  screening: Stethoscope,
  adherence: Stethoscope,
  family: Heart,
};

const UI = {
  chooseLang: {
    en: "Choose your language",
    hi: "Apni bhasha chunen",
    gu: "Tamari bhasha pasand karo",
  },
  chooseLangHint: {
    en: "Lessons and diet tips will show in this language.",
    hi: "Path aur aahar tips isi bhasha mein dikhenge.",
    gu: "Path ane aahar tips aa bhashama dekhase.",
  },
  learn: {
    en: "Learn & practice",
    hi: "Seekhen aur abhyas karein",
    gu: "Shikho ane practice karo",
  },
  learnHint: {
    en: "Short lessons for your care routine — no videos, just clear steps.",
    hi: "Aapki care routine ke liye chhote path — bina video, sirf spasht steps.",
    gu: "Tamari care routine mate nana path — video vagar, spasht steps.",
  },
} as const;

type Props = {
  audience: EduAudience;
  suggestedLabel?: string;
  defaultTopic?: EduTopicId;
};

export function WatchLearnHub({
  audience,
  suggestedLabel,
  defaultTopic = "all",
}: Props) {
  const [locale, setLocale] = useState<EduLocale>("en");
  const [topic, setTopic] = useState<EduTopicId>(defaultTopic);

  useEffect(() => {
    setTopic(defaultTopic);
  }, [defaultTopic]);

  const topics = useMemo(() => getEducationTopics(audience), [audience]);
  const lessons = useMemo(() => {
    const base = getEducationLessons(audience);
    if (locale === "en") return base;
    const ruralLocale: RuralLocale = locale === "gu" ? "gu" : "hi";
    const cards = getEducationCards(ruralLocale);
    const topicMap: Record<string, Exclude<EduTopicId, "all">> = {
      medicine: "medicine",
      diet: "diet",
      exercise: "habits",
      warning_signs: "emergency",
      follow_up: "adherence",
      emergency: "emergency",
    };
    const localized: EduLesson[] = cards.map((c) => {
      const t = topicMap[c.topic] || "habits";
      const loc = { en: c.title, hi: c.title, gu: c.title };
      const body = { en: c.body, hi: c.body, gu: c.body };
      const bullets = { en: c.bullets, hi: c.bullets, gu: c.bullets };
      return {
        id: `locale-${c.id}`,
        topics: [t],
        kind: c.topic === "diet" ? "diet" : "tip",
        title: loc,
        body,
        bullets,
      } satisfies EduLesson;
    });
    const byTopic = new Map(localized.map((l) => [l.topics[0], l]));
    return [
      ...base.map((lesson) => {
        const overlay = lesson.topics
          .map((t) => byTopic.get(t))
          .find(Boolean);
        if (!overlay) return lesson;
        return {
          ...lesson,
          title: { ...lesson.title, [locale]: overlay.title.en },
          body: { ...lesson.body, [locale]: overlay.body.en },
          bullets: overlay.bullets
            ? {
                en: lesson.bullets?.en || [],
                hi: lesson.bullets?.hi || [],
                gu: lesson.bullets?.gu || [],
                [locale]: overlay.bullets.en,
              }
            : lesson.bullets,
        };
      }),
      ...localized.filter(
        (l) => !base.some((b) => b.topics.includes(l.topics[0])),
      ),
    ];
  }, [audience, locale]);

  const filtered = useMemo(() => {
    if (topic === "all") return lessons;
    return lessons.filter((l) => l.topics.includes(topic));
  }, [lessons, topic]);

  const topicLabel =
    topics.find((t) => t.id === topic)?.label[locale] ||
    topics.find((t) => t.id === topic)?.label.en ||
    "Topics";

  return (
    <div className="space-y-5 pb-10">
      {suggestedLabel ? (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex max-w-full items-center rounded-full bg-teal-100 px-3 py-1.5 text-xs font-semibold text-teal-900"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          <span className="truncate">Suggested for you · {suggestedLabel}</span>
        </motion.div>
      ) : null}

      <section className="rounded-[1.75rem] border border-border bg-gradient-to-br from-white via-sky-50/40 to-teal-50/50 p-4 shadow-soft sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
            <Languages className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">
              {UI.chooseLang[locale]}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {UI.chooseLangHint[locale]}
            </p>
          </div>
        </div>
        <div
          className="mt-4 grid grid-cols-3 gap-1 rounded-2xl bg-slate-100/90 p-1"
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
                  "flex flex-col items-center justify-center rounded-xl px-2 py-2.5 transition",
                  active
                    ? "bg-white text-teal-800 shadow-sm ring-1 ring-teal-200/80"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="text-sm font-bold tracking-wide">
                  {l.label}
                </span>
                <span className="mt-0.5 text-[11px] font-medium opacity-80">
                  {l.full}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {topics.map((t) => {
          const Icon = TOPIC_ICONS[t.id] || Sparkles;
          const active = topic === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTopic(t.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition",
                active
                  ? "text-white shadow-md"
                  : "border border-border bg-white text-foreground hover:bg-muted/60",
              )}
              style={
                active
                  ? { backgroundColor: t.accent || "#0F766E" }
                  : undefined
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label[locale]}
            </button>
          );
        })}
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-2 text-teal-800">
          <BookOpen className="h-4 w-4" />
          <p className="text-xs font-bold uppercase tracking-[0.16em]">
            {UI.learn[locale]}
          </p>
        </div>
        <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {topicLabel}
        </h2>
        <p className="text-sm text-muted-foreground">{UI.learnHint[locale]}</p>

        <div className="grid gap-3">
          {filtered.map((lesson, i) => (
            <motion.article
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.24) }}
              className="rounded-[1.5rem] border border-border bg-gradient-to-br from-card via-card to-teal-50/40 p-5 shadow-soft"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-800">
                {lesson.kind === "diet"
                  ? "Diet"
                  : lesson.kind === "video"
                    ? "Lesson"
                    : "Tip"}
              </p>
              <h3 className="mt-1 font-display text-xl font-semibold">
                {lesson.title[locale]}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {lesson.body[locale]}
              </p>
              {lesson.bullets?.[locale]?.length ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {lesson.bullets[locale].map((b) => (
                    <li
                      key={b}
                      className="rounded-xl bg-white/80 px-3 py-2 ring-1 ring-border/60"
                    >
                      • {b}
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.article>
          ))}
          {!filtered.length ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No lessons for this topic — try All topics.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
