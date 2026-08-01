import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Pill,
  QrCode,
  Thermometer,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Reveal, SectionEyebrow } from "@/modules/marketing/landing/reveal";

export function PatientPreview() {
  return (
    <section id="for-patients" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <Reveal className="order-2 lg:order-1">
            <div className="relative mx-auto w-full max-w-[320px]">
              <div className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#2563EB]/20 to-[#14B8A6]/15 blur-2xl" />
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative overflow-hidden rounded-[2.25rem] border-[6px] border-[#0F172A] bg-[#F8FAFC] shadow-[0_30px_80px_rgba(15,23,42,0.18)]"
              >
                <div className="mx-auto mt-2 h-5 w-24 rounded-full bg-[#0F172A]" />
                <div className="space-y-3 p-4 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                        Today
                      </p>
                      <p className="text-sm font-bold text-[#0F172A]">
                        Recovery Journey
                      </p>
                    </div>
                    <div className="rounded-xl bg-white px-2.5 py-1 text-center shadow-sm ring-1 ring-[#0F172A]/05">
                      <p className="text-[10px] text-[#64748B]">Score</p>
                      <p className="text-lg font-bold text-[#2563EB]">86</p>
                    </div>
                  </div>

                  <PhoneCard
                    icon={Pill}
                    title="Medicine reminder"
                    body="Metformin 500mg · 8:00 PM"
                    action="Mark taken"
                    tone="blue"
                  />
                  <PhoneCard
                    icon={Thermometer}
                    title="Daily check-in"
                    body="Log pain, vitals & symptoms"
                    action="Start"
                    tone="teal"
                  />
                  <PhoneCard
                    icon={CalendarClock}
                    title="Appointment"
                    body="Dr. Sharma · Tomorrow 10:30"
                    action="Details"
                    tone="green"
                  />
                  <div className="rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#14B8A6] p-3.5 text-white">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/80">
                          Health Passport
                        </p>
                        <p className="mt-1 text-sm font-bold">Asha Patel</p>
                        <p className="text-[11px] text-white/80">
                          ABHA · Blood O+ · 2 allergies
                        </p>
                      </div>
                      <QrCode className="h-10 w-10 opacity-90" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Reveal>

          <Reveal className="order-1 lg:order-2">
            <SectionEyebrow>For patients</SectionEyebrow>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#0F172A] sm:text-5xl">
              A recovery companion that{" "}
              <span className="hn-gradient-text">feels effortless</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-[#64748B] sm:text-lg">
              Medicines, check-ins, appointments, and passport access — designed
              for clarity on every screen size.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "One-tap medicine adherence",
                "Guided daily health check-ins",
                "Live recovery score with care-team visibility",
              ].map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 text-sm font-medium text-[#334155]"
                >
                  <CheckCircle2 className="h-4 w-4 text-[#22C55E]" />
                  {t}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className="mt-8 inline-flex h-11 items-center rounded-2xl bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(37,99,235,0.3)] transition hover:bg-[#1D4ED8]"
            >
              Try patient experience
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PhoneCard({
  icon: Icon,
  title,
  body,
  action,
  tone,
}: {
  icon: typeof Pill;
  title: string;
  body: string;
  action: string;
  tone: "blue" | "teal" | "green";
}) {
  const colors = {
    blue: "bg-[#2563EB]/10 text-[#2563EB]",
    teal: "bg-[#14B8A6]/10 text-[#0F766E]",
    green: "bg-[#22C55E]/10 text-[#15803D]",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-[#0F172A]/05">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${colors[tone]}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-bold text-[#0F172A]">{title}</p>
        <p className="truncate text-[11px] text-[#64748B]">{body}</p>
      </div>
      <span className="shrink-0 text-[10px] font-semibold text-[#2563EB]">
        {action}
      </span>
    </div>
  );
}
