import { Section } from "@/modules/marketing/components/section";
import { TESTIMONIALS } from "@/modules/marketing/data";

export function TestimonialsSection() {
  return (
    <Section
      eyebrow="Stories"
      title="Trusted by people who deliver care"
      description="Demo testimonials illustrating the product narrative."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <blockquote
            key={t.name}
            className="flex flex-col rounded-3xl border border-border/80 bg-card/70 p-5 shadow-soft"
          >
            <p className="flex-1 text-sm leading-relaxed text-foreground/90">
              “{t.quote}”
            </p>
            <footer className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                {t.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </footer>
          </blockquote>
        ))}
      </div>
    </Section>
  );
}
