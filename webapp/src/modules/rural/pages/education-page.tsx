import { WatchLearnHub } from "@/modules/education/watch-learn-hub";

export function RuralEducationPage() {
  return (
    <div className="space-y-2">
      <div className="mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Health worker education
        </p>
        <h2 className="font-display text-2xl font-semibold">
          Field skills · camps · counseling
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Screening camps, adherence, diet counseling and emergencies — clear
          text lessons in EN / HI / GU.
        </p>
      </div>
      <WatchLearnHub
        audience="health_worker"
        suggestedLabel="NCD outreach · camp screening & follow-up"
        defaultTopic="screening"
      />
    </div>
  );
}
