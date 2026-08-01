import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Brain,
  ClipboardList,
  HeartPulse,
  Home,
  LayoutDashboard,
  Stethoscope,
} from "lucide-react";

import {
  AIEngineVisual,
  HospitalDashboardVisual,
  PassportCardVisual,
  RecoveryVisual,
} from "@/modules/marketing/components/story-visuals";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

const scenes = [
  {
    title: "Hospital",
    description:
      "The journey begins at discharge. HealNexus captures the care plan before the patient leaves the ward.",
    icon: Stethoscope,
    accent: "bg-primary/10 text-primary",
    visual: "hospital-dashboard" as const,
  },
  {
    title: "Patient discharge",
    description:
      "A digital passport is ready — medicines, allergies, and next steps securely on the patient’s device.",
    icon: ClipboardList,
    accent: "bg-primary/10 text-primary",
    visual: "passport-card" as const,
  },
  {
    title: "Home recovery",
    description:
      "Daily check-ins and medicine reminders keep recovery on track without overwhelming the patient.",
    icon: Home,
    accent: "bg-secondary/15 text-secondary",
    visual: "mobile-mockup" as const,
  },
  {
    title: "AI monitoring",
    description:
      "The Care Companion watches trends and surfaces early risk — assisting clinicians, never replacing them.",
    icon: Brain,
    accent: "bg-primary/10 text-primary",
    visual: "ai-flow" as const,
  },
  {
    title: "Doctor intelligence",
    description:
      "Clinicians see a priority queue — focus on who needs attention today, with a clear next action.",
    icon: LayoutDashboard,
    accent: "bg-warning/15 text-warning-foreground",
    visual: "doctor-dashboard" as const,
  },
  {
    title: "Healthy recovery",
    description:
      "Fewer surprises, better engagement, and continuity that lasts beyond hospital walls.",
    icon: HeartPulse,
    accent: "bg-secondary/15 text-secondary",
    visual: "recovery-success" as const,
  },
];

export function StorytellingScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRefs = useRef<Array<HTMLDivElement | null>>([]);
  const visualRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      scenes.forEach((_, index) => {
        const textEl = textRefs.current[index];
        const visualEl = visualRefs.current[index];
        if (!textEl || !visualEl) return;

        gsap.fromTo(
          textEl,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: textEl,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );

        gsap.fromTo(
          visualEl,
          { opacity: 0, scale: 0.94, y: 24 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.8,
            scrollTrigger: {
              trigger: textEl,
              start: "top 80%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="solutions"
      ref={containerRef}
      className="relative scroll-mt-24 bg-background py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-14 text-center">
          <p className="text-label">The journey</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Continuity of care, end to end
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            From discharge to durable recovery — connected for patients,
            doctors, caregivers, and rural teams.
          </p>
        </div>

        <div className="relative">
          <div className="absolute bottom-0 left-1/2 top-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-border to-transparent md:block" />

          <div className="space-y-24 md:space-y-28">
            {scenes.map((scene, i) => {
              const isEven = i % 2 === 0;
              const Icon = scene.icon;

              return (
                <div
                  key={scene.title}
                  className="relative grid items-center gap-10 md:grid-cols-2 md:gap-16"
                >
                  <div
                    ref={(el) => {
                      visualRefs.current[i] = el;
                    }}
                    className={cn(
                      "order-2 md:order-none",
                      isEven ? "md:col-start-2" : "md:col-start-1",
                    )}
                  >
                    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl border border-border/70 bg-muted/30 p-6 shadow-soft">
                      {scene.visual === "hospital-dashboard" ||
                      scene.visual === "doctor-dashboard" ? (
                        <HospitalDashboardVisual />
                      ) : null}
                      {scene.visual === "passport-card" ? (
                        <PassportCardVisual />
                      ) : null}
                      {scene.visual === "ai-flow" ? <AIEngineVisual /> : null}
                      {scene.visual === "recovery-success" ? (
                        <RecoveryVisual />
                      ) : null}
                      {scene.visual === "mobile-mockup" ? (
                        <div className="relative z-10 flex h-80 w-44 flex-col rounded-[1.75rem] border-4 border-foreground/80 bg-card p-4 shadow-lift">
                          <div className="mx-auto mb-4 h-1 w-14 rounded-full bg-muted" />
                          <div className="space-y-3">
                            <div className="h-16 rounded-2xl bg-primary/10" />
                            <div className="h-11 rounded-2xl border border-secondary/25 bg-secondary/10" />
                            <div className="h-11 rounded-2xl border border-primary/25 bg-primary/10" />
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div
                    ref={(el) => {
                      textRefs.current[i] = el;
                    }}
                    className={cn(
                      "order-1 md:order-none",
                      isEven ? "md:col-start-1 md:text-right" : "md:col-start-2",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl",
                        scene.accent,
                        isEven && "md:float-right md:ml-4",
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="clear-both font-display text-2xl font-semibold tracking-tight">
                      {scene.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                      {scene.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
