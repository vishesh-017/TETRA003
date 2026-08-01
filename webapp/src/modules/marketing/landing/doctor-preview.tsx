import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

const BARS = [62, 74, 58, 81, 69, 88, 76, 91, 84, 79, 93, 86];

export function DoctorPreview() {
  return (
    <section id="for-doctors" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <Reveal>
            <SectionEyebrow>For doctors</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
              Clinical command with{" "}
              <span className="hn-gradient-text">AI that explains itself</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#64748B] sm:text-lg">
              Prioritize high-risk patients, review recovery trajectories, and
              approve AI care plans without leaving your workflow.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#334155]">
              {[
                "Priority queue sorted by readmission risk",
                "Medicine adherence & missed check-ins at a glance",
                "Doctor-in-the-loop AI summaries — never autonomous care",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2563EB]" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-8 inline-flex h-11 items-center rounded-2xl bg-[#0F172A] px-5 text-sm font-semibold text-white transition hover:bg-[#1E293B]"
            >
              Explore doctor workspace
            </Link>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="hn-card-premium relative overflow-hidden rounded-[1.75rem] p-5 sm:p-6">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#2563EB]/10 blur-3xl" />
              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                    Intelligence Center
                  </p>
                  <p className="mt-1 text-lg font-bold text-[#0F172A]">
                    Cohort analytics
                  </p>
                </div>
                <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-semibold text-[#475569]">
                  Last 7 days
                </span>
              </div>

              <div className="relative mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { l: "Avg recovery", v: "82.4", d: "+3.1" },
                  { l: "High risk", v: "7", d: "−2" },
                  { l: "Adherence", v: "94%", d: "+1.8" },
                ].map((k) => (
                  <div
                    key={k.l}
                    className="rounded-2xl border border-[#0F172A]/06 bg-[#F8FAFC] p-3.5"
                  >
                    <p className="text-[11px] font-medium text-[#64748B]">
                      {k.l}
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[#0F172A]">
                      {k.v}
                    </p>
                    <p className="text-[11px] font-semibold text-[#16A34A]">
                      {k.d}
                    </p>
                  </div>
                ))}
              </div>

              <div className="relative mt-4 rounded-2xl border border-[#0F172A]/06 bg-white p-4">
                <p className="text-xs font-semibold text-[#0F172A]">
                  Recovery distribution
                </p>
                <div className="mt-4 flex h-28 items-end gap-1.5">
                  {BARS.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04, duration: 0.45 }}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-[#2563EB] to-[#14B8A6]"
                    />
                  ))}
                </div>
              </div>

              <div className="relative mt-4 rounded-2xl border border-[#0F172A]/06 bg-gradient-to-br from-[#2563EB]/5 to-[#14B8A6]/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#2563EB]">
                  AI summary
                </p>
                <p className="mt-2 text-sm leading-relaxed text-[#334155]">
                  Three patients show rising pain + missed medicines. Recommend
                  caregiver outreach today; no autonomous prescription changes.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
