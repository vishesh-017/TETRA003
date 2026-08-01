import { Section } from "@/modules/marketing/components/section";
import { TRUSTED } from "@/modules/marketing/data";

export function TrustedBySection() {
  return (
    <Section className="!py-10">
      <p className="text-center text-label">Trusted by care teams (demo)</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TRUSTED.map((name) => (
          <div
            key={name}
            className="flex h-16 items-center justify-center rounded-2xl border border-border/70 bg-card/70 px-3 text-center text-xs font-semibold text-muted-foreground shadow-soft"
          >
            {name}
          </div>
        ))}
      </div>
    </Section>
  );
}
