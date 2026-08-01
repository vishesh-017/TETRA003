import { motion } from "framer-motion";
import { FileCheck2, Landmark, Link2, Shield } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/modules/identity/components/glass-panel";
import type { BenefitsDashboard as BenefitsDashboardData } from "@/modules/identity/types";

export function BenefitsDashboard({ data }: { data: BenefitsDashboardData }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatusCard
          icon={Shield}
          title="ABHA status"
          value={data.abha_linked ? "Linked (live)" : "Not linked"}
          detail={data.abha_id || "Import via ABHA to link"}
          badge={data.abha_linked ? "Active" : "Action"}
        />
        <StatusCard
          icon={Landmark}
          title="PM-JAY status"
          value={labelPmjay(data.pmjay_status)}
          detail={
            data.pmjay_confidence
              ? `Confidence ${(data.pmjay_confidence * 100).toFixed(0)}%`
              : "Run the PM-JAY assistant to estimate"
          }
          badge={data.pmjay_status === "likely_eligible" ? "Likely" : "Review"}
        />
        <StatusCard
          icon={Link2}
          title="Linked records"
          value={String(data.linked_record_count)}
          detail="ABHA + local health records"
        />
        <StatusCard
          icon={FileCheck2}
          title="Important documents"
          value={`${data.documents.filter((d) => d.ready).length}/${data.documents.length} ready`}
          detail="Keep IDs handy for hospital desks"
        />
      </div>

      <section className="glass-panel rounded-3xl p-5">
        <SectionLabel>Government schemes</SectionLabel>
        <div className="mt-3 space-y-3">
          {data.schemes.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/70 bg-background/50 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{s.name}</p>
                <Badge variant="outline">{s.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-3xl p-5">
        <SectionLabel>Healthcare benefits & documents</SectionLabel>
        <ul className="mt-3 space-y-2">
          {data.documents.map((d) => (
            <li
              key={d.name}
              className="flex items-center justify-between gap-2 rounded-2xl border border-border/60 px-3 py-2 text-sm"
            >
              <span>
                {d.name}
                {d.required ? (
                  <span className="ml-1 text-xs text-muted-foreground">
                    required
                  </span>
                ) : null}
              </span>
              <Badge variant={d.ready ? "secondary" : "outline"}>
                {d.ready ? "Ready" : "Needed"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function StatusCard({
  icon: Icon,
  title,
  value,
  detail,
  badge,
}: {
  icon: typeof Shield;
  title: string;
  value: string;
  detail: string;
  badge?: string;
}) {
  return (
    <div className="glass-panel rounded-3xl p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {badge ? <Badge variant="outline">{badge}</Badge> : null}
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 font-display text-xl font-semibold capitalize">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}

function labelPmjay(status: BenefitsDashboardData["pmjay_status"]) {
  switch (status) {
    case "likely_eligible":
      return "Likely eligible";
    case "needs_review":
      return "Needs review";
    case "not_likely":
      return "Less likely";
    default:
      return "Not assessed";
  }
}
