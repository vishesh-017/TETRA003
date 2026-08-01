import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

const STATS = [
  { value: 10000, suffix: "+", label: "Patients", format: (n: number) => `${Math.round(n / 1000)}K` },
  { value: 95, suffix: "%", label: "Medicine Adherence", format: (n: number) => `${Math.round(n)}` },
  { value: 40, suffix: "%", label: "Reduced Readmissions", format: (n: number) => `${Math.round(n)}` },
  { value: 500, suffix: "+", label: "Doctors", format: (n: number) => `${Math.round(n)}` },
];

function Counter({
  value,
  suffix,
  format,
}: {
  value: number;
  suffix: string;
  format: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  useEffect(() => {
    const unsub = spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = `${format(latest)}${suffix}`;
    });
    return unsub;
  }, [spring, format, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      0{suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="hn-card-premium relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2563EB]/8 via-transparent to-[#14B8A6]/10" />
          <div className="relative text-center">
            <SectionEyebrow>Impact</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold text-[#0F172A] sm:text-4xl">
              Built for scale. Measured in outcomes.
            </h2>
          </div>
          <div className="relative mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center"
              >
                <p className="font-display text-4xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
                  <Counter
                    value={s.value}
                    suffix={s.suffix}
                    format={s.format}
                  />
                </p>
                <p className="mt-2 text-sm font-medium text-[#64748B]">
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
