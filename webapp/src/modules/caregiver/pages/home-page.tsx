import { AnimatePresence, motion } from "framer-motion";
import { HeartHandshake } from "lucide-react";

import { ActivityFeed } from "@/modules/caregiver/components/activity-feed";
import { AiCareInsights } from "@/modules/caregiver/components/ai-insights";
import { AppointmentSpotlight } from "@/modules/caregiver/components/appointment-spotlight";
import { CareTimeline } from "@/modules/caregiver/components/care-timeline";
import { DoctorMessages } from "@/modules/caregiver/components/doctor-messages";
import { EducationCarousel } from "@/modules/caregiver/components/education-carousel";
import { CaregiverEmergencyBanner } from "@/modules/caregiver/components/emergency-banner";
import { EmergencyPanel } from "@/modules/caregiver/components/emergency-panel";
import { FamilyCard } from "@/modules/caregiver/components/family-card";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { HealthRing } from "@/modules/caregiver/components/health-ring";
import { InsightCards } from "@/modules/caregiver/components/insight-cards";
import { MedicineSchedule } from "@/modules/caregiver/components/medicine-schedule";
import { PassportTiltCard } from "@/modules/caregiver/components/passport-tilt-card";
import { SmartAlerts } from "@/modules/caregiver/components/smart-alerts";
import { useCaregiver } from "@/modules/caregiver/context";
import { greetingPrefix } from "@/modules/caregiver/lib";

export function CaregiverHomePage() {
  const {
    caregiverName,
    family,
    selected,
    selectMember,
    timeline,
    insights,
    doctorMessages,
    alerts,
    medicines,
    appointments,
    passport,
    aiInsight,
    education,
    activity,
    source,
  } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-7 pb-14">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 px-5 py-6 shadow-soft backdrop-blur sm:px-8 sm:py-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-10 h-48 w-48 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-800">
              <HeartHandshake className="h-4 w-4" />
              Family Care Companion
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              {greetingPrefix()}, {caregiverName}{" "}
              <span aria-hidden className="inline-block origin-bottom-left animate-[wave_1.4s_ease-in-out_infinite]">
                👋
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-base text-muted-foreground sm:text-lg">
              You&apos;re caring for {family.length} family member
              {family.length === 1 ? "" : "s"} today.
            </p>
            <p className="mt-2 inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-teal-900 ring-1 ring-teal-100">
              {source === "live"
                ? "Live care arrangements"
                : "Demo family preview"}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50/90 px-4 py-3 text-sm text-muted-foreground ring-1 ring-border/70">
            <p className="font-semibold text-foreground">Focus right now</p>
            <p className="mt-1">
              {selected.status === "stable"
                ? `${selected.name.split(" ")[0]} looks stable — keep the routine going.`
                : `${selected.name.split(" ")[0]} needs your attention today.`}
            </p>
          </div>
        </div>
      </motion.header>

      <FamilySwitcher />

      <CaregiverEmergencyBanner />

      <div className="grid gap-4 lg:grid-cols-2">
        {family.map((member) => (
          <FamilyCard
            key={member.id}
            member={member}
            active={member.id === selected.id}
            onSelect={() => selectMember(member.id)}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.28 }}
          className="flex flex-col gap-7"
        >
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <HealthRing member={selected} />
            <CareTimeline items={timeline} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <InsightCards insights={insights} />
            <div className="space-y-5">
              <DoctorMessages messages={doctorMessages} />
              <SmartAlerts alerts={alerts} />
            </div>
          </div>

          <EmergencyPanel compact />

          <MedicineSchedule medicines={medicines} />

          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <AppointmentSpotlight appointments={appointments} />
            <PassportTiltCard passport={passport} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <AiCareInsights insight={aiInsight} />
            <EducationCarousel tips={education} />
          </div>

          <ActivityFeed items={activity} />
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(14deg); }
          40% { transform: rotate(-8deg); }
        }
      `}</style>
    </div>
  );
}
