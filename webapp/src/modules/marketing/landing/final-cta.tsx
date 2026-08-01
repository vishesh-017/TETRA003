import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Reveal } from "@/modules/marketing/landing/reveal";

export function FinalCta() {
  return (
    <section className="relative pb-24 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-[#0F172A] px-6 py-14 text-center sm:px-12 sm:py-16">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_20%_0%,rgba(37,99,235,0.45),transparent_55%),radial-gradient(ellipse_50%_60%_at_90%_100%,rgba(20,184,166,0.35),transparent_50%)]" />
            <div className="relative">
              <p className="text-[13px] font-semibold uppercase tracking-[0.18em] text-[#14B8A6]">
                Start today
              </p>
              <h2 className="font-display mx-auto mt-3 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-5xl">
                Continuity of care that looks as good as it works
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
                Jump into a live workspace as a doctor, patient, caregiver, or
                health worker — AI assists, clinicians decide.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  to="/signup"
                  className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-sm font-semibold text-[#0F172A] transition hover:bg-[#F1F5F9]"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-12 items-center rounded-2xl border border-white/20 bg-white/5 px-6 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
