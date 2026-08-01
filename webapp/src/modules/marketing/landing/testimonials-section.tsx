import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

const QUOTES = [
  {
    role: "Cardiologist",
    org: "Civil Hospital Ahmedabad",
    name: "Dr. Meera Sharma",
    quote:
      "HealNexus gives me a living view of post-discharge risk. The AI drafts the plan — I approve what ships to the patient.",
    initials: "MS",
  },
  {
    role: "Hospital Admin",
    org: "Multi-specialty Network",
    name: "Ankit Desai",
    quote:
      "We finally closed the loop between ward discharge and home recovery. Readmission huddles are sharper and faster.",
    initials: "AD",
  },
  {
    role: "Patient",
    org: "Post-CABG recovery",
    name: "Ravi Mehta",
    quote:
      "Medicine reminders and daily check-ins keep my family and doctor aligned. It feels like the hospital is still with me.",
    initials: "RM",
  },
];

export function TestimonialsSection() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionEyebrow>Trusted voices</SectionEyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
            Designed with clinicians.{" "}
            <span className="hn-gradient-text">Loved at home.</span>
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {QUOTES.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.08}>
              <figure className="hn-glass flex h-full flex-col rounded-[1.5rem] p-6">
                <blockquote className="flex-1 text-[15px] leading-relaxed text-[#334155]">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-[#0F172A]/06 pt-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-xs font-bold text-white">
                    {q.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{q.name}</p>
                    <p className="text-xs text-[#64748B]">
                      {q.role} · {q.org}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
