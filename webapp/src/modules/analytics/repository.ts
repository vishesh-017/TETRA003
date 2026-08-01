import { format, subDays } from "date-fns";

import {
  AHMEDABAD_DEMO_HOSPITALS,
  AHMEDABAD_MAP_CENTER,
  haversineKm,
} from "@/data/ahmedabad-hospitals";
import { getStore, IDS, subscribeStore, todayKey } from "@/data/store";
import { evaluateHealth, type RiskCategory } from "@/lib/health-engine";
import { doctorRepository } from "@/modules/doctor/repository";
import type { RiskLevel } from "@/modules/doctor/types";
import { buildObservationsForPatient } from "@/modules/prediction/adapters";

import type {
  AnalyticsFilters,
  AttentionPatient,
  DistributionBucket,
  DoctorPerformanceRow,
  ExecutiveAnalyticsBundle,
  HighlightInsight,
  HospitalMapItem,
  KpiMetric,
  NamedCount,
  ReportKind,
  ReportPayload,
  TrendDirection,
  TrendPoint,
} from "./types";

interface CohortRow {
  patient_id: string;
  full_name: string;
  age: number | null;
  conditions: string[];
  doctor_id: string;
  recovery: number;
  adherence: number;
  readmission: number;
  risk: RiskLevel;
  progression: string;
  engagement: number;
  needs_attention: boolean;
  attention_reason: string;
}

function mapRisk(category: RiskCategory): RiskLevel {
  if (category === "medium") return "moderate";
  return category;
}

function adherenceFor(patientId: string): number {
  const store = getStore();
  const meds = store.medicines.filter(
    (m) => m.patient_id === patientId && m.active,
  );
  if (!meds.length) return 72;
  const today = todayKey();
  const events = store.medicineEvents.filter(
    (e) => e.patient_id === patientId && e.date === today,
  );
  if (!events.length) {
    return Math.min(
      100,
      Math.max(
        40,
        (store.recoveryScores.find((r) => r.patient_id === patientId)?.score ??
          70) - 8,
      ),
    );
  }
  const taken = events.filter((e) => e.status === "taken").length;
  return Math.round((taken / Math.max(events.length, 1)) * 100);
}

function engagementFor(patientId: string): number {
  const store = getStore();
  const cutoff = subDays(new Date(), 7).toISOString();
  const checkins = store.checkins.filter(
    (c) => c.patient_id === patientId && c.recorded_at >= cutoff,
  ).length;
  return Math.min(100, Math.round((checkins / 7) * 100));
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function trendOf(delta: number): TrendDirection {
  if (Math.abs(delta) < 0.6) return "flat";
  return delta > 0 ? "up" : "down";
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function wobble(seed: number, i: number, amp = 4): number {
  return Math.sin(seed * 1.7 + i * 0.85) * amp + Math.cos(i * 0.4) * (amp * 0.35);
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, n));
}

function buildSeries(
  base: {
    recovery: number;
    adherence: number;
    readmission: number;
    followup: number;
  },
  count: number,
  labelFn: (i: number) => string,
  stepBias: number,
): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count - 1, 1);
    const progress = (t - 0.5) * stepBias;
    points.push({
      label: labelFn(i),
      recovery_score: clamp(
        base.recovery - progress * 3 + wobble(base.recovery, i, 3.2),
      ),
      medicine_adherence: clamp(
        base.adherence - progress * 2.5 + wobble(base.adherence, i + 2, 3.8),
      ),
      readmission_risk: clamp(
        base.readmission + progress * 2.2 + wobble(base.readmission, i + 4, 2.8),
      ),
      followup_completion: clamp(
        base.followup - progress * 1.8 + wobble(base.followup, i + 1, 2.5),
      ),
    });
  }
  return points;
}

function distribution(
  items: Array<{ key: string; label: string }>,
  getKey: (row: CohortRow) => string,
  rows: CohortRow[],
): DistributionBucket[] {
  const total = Math.max(rows.length, 1);
  return items.map((item) => {
    const value = rows.filter((r) => getKey(r) === item.key).length;
    return {
      key: item.key,
      label: item.label,
      value,
      pct: Math.round((value / total) * 100),
    };
  });
}

function ensureDoctorUser(userId: string) {
  const store = getStore();
  return (
    store.doctors.find((d) => d.user_id === userId) ||
    store.doctors.find((d) => d.id === IDS.doctor)!
  );
}

function buildCohort(userId: string): CohortRow[] {
  const patients = doctorRepository.listPatients(userId);
  const doctor = ensureDoctorUser(userId);
  const store = getStore();
  const today = todayKey();

  return patients.map((p) => {
    const health = evaluateHealth(buildObservationsForPatient(p.id));
    const adherence = adherenceFor(p.id);
    const risk = mapRisk(health.readmission.risk_category);
    const recovery = health.recovery.recovery_score;
    const engagement = engagementFor(p.id);
    const last = store.checkins
      .filter((c) => c.patient_id === p.id)
      .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))[0]
      ?.recorded_at;
    const missed = !last || last.slice(0, 10) < today;
    const needs =
      risk === "high" ||
      risk === "critical" ||
      recovery < 60 ||
      adherence < 70 ||
      missed;
    let reason = "Stable — routine monitoring";
    if (risk === "critical" || risk === "high")
      reason = `Elevated readmission risk (${risk})`;
    else if (adherence < 70) reason = `Medicine adherence at ${adherence}%`;
    else if (recovery < 60) reason = `Recovery score ${recovery.toFixed(0)}/100`;
    else if (missed) reason = "Missed recent daily check-in";

    return {
      patient_id: p.id,
      full_name: p.full_name,
      age: p.age ?? null,
      conditions: p.chronic_diseases || [],
      doctor_id: doctor.id,
      recovery,
      adherence,
      readmission: health.readmission.readmission_probability_percent,
      risk,
      progression: health.progression.overall_worsening_risk,
      engagement,
      needs_attention: needs,
      attention_reason: reason,
    };
  });
}

function applyFilters(rows: CohortRow[], filters?: Partial<AnalyticsFilters>) {
  if (!filters) return rows;
  let next = [...rows];
  if (filters.age === "under_50")
    next = next.filter((r) => r.age != null && r.age < 50);
  else if (filters.age === "50_plus")
    next = next.filter((r) => r.age != null && r.age >= 50);
  if (filters.disease) {
    const d = filters.disease.toLowerCase();
    next = next.filter((r) =>
      r.conditions.some((c) => c.toLowerCase().includes(d)),
    );
  }
  if (filters.risk) next = next.filter((r) => r.risk === filters.risk);
  if (filters.doctor) next = next.filter((r) => r.doctor_id === filters.doctor);
  return next;
}

function buildKpis(
  current: CohortRow[],
  storeAppts: ReturnType<typeof getStore>["appointments"],
  doctorId: string,
): KpiMetric[] {
  const prevFactor = 0.92; // demo prior-week proxy
  const active = current.length;
  const recoverySuccess =
    (current.filter((r) => r.recovery >= 70).length / Math.max(active, 1)) * 100;
  const avgRecovery = avg(current.map((r) => r.recovery));
  const avgReadmission = avg(current.map((r) => r.readmission));
  const completed = storeAppts.filter(
    (a) => a.doctor_id === doctorId && a.status === "completed",
  ).length;
  const totalAppts = storeAppts.filter((a) => a.doctor_id === doctorId).length;
  const followupRate = (completed / Math.max(totalAppts, 1)) * 100;
  const adherence = avg(current.map((r) => r.adherence));
  const attention = current.filter((r) => r.needs_attention).length;
  const patientIds = new Set(current.map((r) => r.patient_id));
  const invRows = getStore().investigations.filter(
    (i) => patientIds.has(i.patient_id) && i.status !== "cancelled",
  );
  const invDone = invRows.filter(
    (i) => i.status === "completed" || i.status === "review_required",
  ).length;
  const invCompliance =
    (invDone / Math.max(invRows.length, 1)) * 100;

  const mk = (
    id: string,
    label: string,
    value: number,
    unit: KpiMetric["unit"],
    prev: number,
    question: string,
    invertGood = false,
  ): KpiMetric => {
    const delta = value - prev;
    const goodUp = invertGood ? delta < 0 : delta > 0;
    const direction = trendOf(delta);
    return {
      id,
      label,
      value: unit === "count" ? Math.round(value) : Math.round(value * 10) / 10,
      unit,
      delta: Math.round(delta * 10) / 10,
      delta_pct: Math.round(pctChange(value, prev) * 10) / 10,
      trend: direction,
      question,
      hint: `${goodUp || direction === "flat" ? "vs last week" : "vs last week — review"}`,
    };
  };

  return [
    mk(
      "active",
      "Active Patients",
      active,
      "count",
      Math.max(1, Math.round(active * prevFactor)),
      "How many patients are in active post-discharge care?",
    ),
    mk(
      "recovery_success",
      "Recovery Success Rate",
      recoverySuccess,
      "percent",
      recoverySuccess * prevFactor,
      "What share of patients are recovering well (≥70)?",
    ),
    mk(
      "avg_recovery",
      "Average Recovery Score",
      avgRecovery,
      "score",
      avgRecovery * prevFactor,
      "How are patients recovering overall?",
    ),
    mk(
      "avg_readmission",
      "Average Readmission Risk",
      avgReadmission,
      "score",
      avgReadmission / prevFactor,
      "Are readmissions likely decreasing?",
      true,
    ),
    mk(
      "followup",
      "Follow-up Completion Rate",
      followupRate,
      "percent",
      followupRate * prevFactor,
      "Are follow-ups working?",
    ),
    mk(
      "adherence",
      "Medicine Adherence",
      adherence,
      "percent",
      adherence * prevFactor,
      "Is medicine adherence improving?",
    ),
    mk(
      "attention",
      "Patients Requiring Attention",
      attention,
      "count",
      Math.max(0, Math.round(attention / prevFactor)),
      "Which patients need attention?",
      true,
    ),
    mk(
      "investigation_compliance",
      "Investigation Compliance",
      invCompliance,
      "percent",
      invCompliance * prevFactor,
      "Are prescribed investigations being completed?",
    ),
  ];
}

function buildHighlights(
  kpis: KpiMetric[],
  attention: number,
): HighlightInsight[] {
  const recovery = kpis.find((k) => k.id === "avg_recovery");
  const adherence = kpis.find((k) => k.id === "adherence");
  const readmit = kpis.find((k) => k.id === "avg_readmission");
  const follow = kpis.find((k) => k.id === "followup");
  const items: HighlightInsight[] = [];

  if (adherence && adherence.delta_pct !== 0) {
    items.push({
      id: "adh",
      text: `Medicine adherence ${adherence.delta >= 0 ? "increased" : "changed"} by ${Math.abs(adherence.delta_pct).toFixed(0)}% this week.`,
      tone: adherence.delta >= 0 ? "positive" : "attention",
    });
  }
  if (recovery) {
    items.push({
      id: "rec",
      text: `Average recovery score is ${recovery.value.toFixed(0)} (${recovery.delta >= 0 ? "+" : ""}${recovery.delta.toFixed(1)} vs last week).`,
      tone: recovery.delta >= 0 ? "positive" : "attention",
    });
  }
  if (readmit && readmit.delta <= 0) {
    items.push({
      id: "rr",
      text: "Readmission risk is trending down across the cohort.",
      tone: "positive",
    });
  } else if (readmit) {
    items.push({
      id: "rr",
      text: "Readmission risk edged up — prioritise high-risk reviews.",
      tone: "attention",
    });
  }
  if (follow) {
    items.push({
      id: "fu",
      text: `Follow-up completion sits at ${follow.value.toFixed(0)}%.`,
      tone: follow.value >= 60 ? "neutral" : "attention",
    });
  }
  items.push({
    id: "att",
    text:
      attention === 0
        ? "No patients currently flagged for additional follow-up."
        : `${attention} patient${attention === 1 ? "" : "s"} require additional follow-up.`,
    tone: attention > 0 ? "attention" : "positive",
  });
  return items.slice(0, 5);
}

function buildDoctorPerformance(
  rows: CohortRow[],
  storeAppts: ReturnType<typeof getStore>["appointments"],
): DoctorPerformanceRow[] {
  const store = getStore();
  // Demo: clone primary doctor into 2–3 performance personas from cohort splits
  const primary = store.doctors[0];
  const primaryProfile = store.profiles.find((p) => p.id === primary?.user_id);
  if (!primary) return [];

  const split = Math.max(1, Math.ceil(rows.length / 3));
  const personas = [
    {
      doctor_id: primary.id,
      doctor_name: primaryProfile?.full_name || "Dr. Demo Clinician",
      specialty: primary.specialty,
      hospital: primary.hospital_affiliation || "Civil Hospital Ahmedabad",
      slice: rows.slice(0, split),
    },
    {
      doctor_id: `${primary.id}-demo-b`,
      doctor_name: "Dr. N. Mehta (demo)",
      specialty: "Cardiology",
      hospital: "SVP Hospital Ahmedabad",
      slice: rows.slice(split, split * 2),
    },
    {
      doctor_id: `${primary.id}-demo-c`,
      doctor_name: "Dr. S. Iyer (demo)",
      specialty: "Endocrinology",
      hospital: "LG Hospital Ahmedabad",
      slice: rows.slice(split * 2),
    },
  ];

  return personas.map((p) => {
    const slice = p.slice.length ? p.slice : rows.slice(0, 1);
    const completed = storeAppts.filter((a) => a.status === "completed").length;
    const total = Math.max(storeAppts.length, 1);
    return {
      doctor_id: p.doctor_id,
      doctor_name: p.doctor_name,
      specialty: p.specialty,
      hospital: p.hospital,
      patients_managed: slice.length,
      average_recovery: Math.round(avg(slice.map((r) => r.recovery)) * 10) / 10,
      followup_rate: Math.round(
        (completed / total) * 100 * (0.88 + (slice.length % 3) * 0.04) * 10,
      ) / 10,
      patient_engagement:
        Math.round(avg(slice.map((r) => r.engagement)) * 10) / 10,
    };
  });
}

function buildHospitals(): HospitalMapItem[] {
  return AHMEDABAD_DEMO_HOSPITALS.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    phone: h.phone || "—",
    hospital_type: h.hospital_type,
    latitude: h.latitude,
    longitude: h.longitude,
    distance_km:
      Math.round(
        haversineKm(
          AHMEDABAD_MAP_CENTER.lat,
          AHMEDABAD_MAP_CENTER.lng,
          h.latitude,
          h.longitude,
        ) * 10,
      ) / 10,
    services: h.services || [],
    pmjay_empanelled: h.pmjay_empanelled,
    is_emergency: h.is_emergency,
  }));
}

export const analyticsRepository = {
  subscribe(listener: () => void) {
    return subscribeStore(listener);
  },

  getBundle(
    userId: string,
    filters?: Partial<AnalyticsFilters>,
  ): ExecutiveAnalyticsBundle {
    const doctor = ensureDoctorUser(userId);
    const store = getStore();
    const all = buildCohort(userId);
    const rows = applyFilters(all, filters);

    const base = {
      recovery: avg(rows.map((r) => r.recovery)) || 68,
      adherence: avg(rows.map((r) => r.adherence)) || 74,
      readmission: avg(rows.map((r) => r.readmission)) || 42,
      followup:
        (store.appointments.filter(
          (a) => a.doctor_id === doctor.id && a.status === "completed",
        ).length /
          Math.max(
            store.appointments.filter((a) => a.doctor_id === doctor.id).length,
            1,
          )) *
          100 || 55,
    };

    const daily = buildSeries(base, 14, (i) => {
      const d = subDays(new Date(), 13 - i);
      return format(d, "MMM d");
    }, 1);

    const weekly = buildSeries(base, 8, (i) => `W${i + 1}`, 1.4);
    const monthly = buildSeries(base, 6, (i) => {
      const d = subDays(new Date(), (5 - i) * 30);
      return format(d, "MMM");
    }, 2);

    const kpis = buildKpis(rows, store.appointments, doctor.id);
    const attentionRows = rows
      .filter((r) => r.needs_attention)
      .sort((a, b) => b.readmission - a.readmission);

    const high_risk_patients: AttentionPatient[] = attentionRows
      .slice(0, 8)
      .map((r) => ({
        patient_id: r.patient_id,
        full_name: r.full_name,
        risk: r.risk,
        recovery_score: Math.round(r.recovery),
        reason: r.attention_reason,
      }));

    const diseaseMap = new Map<string, number>();
    for (const r of rows) {
      for (const c of r.conditions) {
        diseaseMap.set(c, (diseaseMap.get(c) || 0) + 1);
      }
    }
    const top_diseases: NamedCount[] = [...diseaseMap.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const highlights = buildHighlights(kpis, attentionRows.length);
    const recoveryKpi = kpis.find((k) => k.id === "avg_recovery");
    const adherenceKpi = kpis.find((k) => k.id === "adherence");

    const weekly_summary = {
      headline: `This week patient recovery ${
        (recoveryKpi?.delta ?? 0) >= 0 ? "improved" : "softened"
      } by ${Math.abs(recoveryKpi?.delta_pct ?? 0).toFixed(0)}%.`,
      bullets: [
        `Medicine adherence ${(adherenceKpi?.delta ?? 0) >= 0 ? "increased" : "needs focus"} (${adherenceKpi?.value.toFixed(0)}% cohort average).`,
        `${attentionRows.length} patient${attentionRows.length === 1 ? "" : "s"} require additional follow-up.`,
        `Average readmission risk is ${kpis.find((k) => k.id === "avg_readmission")?.value.toFixed(0) ?? "—"}.`,
        `Follow-up completion rate: ${kpis.find((k) => k.id === "followup")?.value.toFixed(0) ?? "—"}%.`,
      ],
      recommendations: [
        "Schedule reviews for patients flagged in the attention list.",
        "Reinforce medicine reminders for adherence below 70%.",
        "Confirm upcoming follow-ups for high-risk patients this week.",
      ],
      generated_at: new Date().toISOString(),
      disclaimer:
        "Assistive analytics only — does not diagnose, prescribe, or replace clinical judgement.",
    };

    const storeDoctors = store.doctors.map((d) => {
      const profile = store.profiles.find((p) => p.id === d.user_id);
      return {
        id: d.id,
        name: profile?.full_name || "Doctor",
      };
    });

    return {
      kpis,
      recovery_series: { daily, weekly, monthly },
      distributions: {
        recovery: distribution(
          [
            { key: "low", label: "< 60" },
            { key: "mid", label: "60–79" },
            { key: "high", label: "80+" },
          ],
          (r) =>
            r.recovery < 60 ? "low" : r.recovery < 80 ? "mid" : "high",
          rows,
        ),
        readmission: distribution(
          [
            { key: "low", label: "Low" },
            { key: "moderate", label: "Moderate" },
            { key: "high", label: "High" },
            { key: "critical", label: "Critical" },
          ],
          (r) => r.risk,
          rows,
        ),
        progression: distribution(
          [
            { key: "low", label: "Low" },
            { key: "moderate", label: "Moderate" },
            { key: "high", label: "High" },
            { key: "critical", label: "Critical" },
          ],
          (r) => r.progression,
          rows,
        ),
        adherence: distribution(
          [
            { key: "low", label: "< 70%" },
            { key: "mid", label: "70–84%" },
            { key: "high", label: "85%+" },
          ],
          (r) =>
            r.adherence < 70 ? "low" : r.adherence < 85 ? "mid" : "high",
          rows,
        ),
        appointment: (() => {
          const scheduled = store.appointments.filter(
            (a) => a.doctor_id === doctor.id && a.status === "scheduled",
          ).length;
          const completed = store.appointments.filter(
            (a) => a.doctor_id === doctor.id && a.status === "completed",
          ).length;
          const missed = store.appointments.filter(
            (a) => a.doctor_id === doctor.id && a.status === "missed",
          ).length;
          const cancelled = store.appointments.filter(
            (a) => a.doctor_id === doctor.id && a.status === "cancelled",
          ).length;
          const total = Math.max(scheduled + completed + missed + cancelled, 1);
          return [
            {
              key: "scheduled",
              label: "Scheduled",
              value: scheduled,
              pct: Math.round((scheduled / total) * 100),
            },
            {
              key: "completed",
              label: "Completed",
              value: completed,
              pct: Math.round((completed / total) * 100),
            },
            {
              key: "missed",
              label: "Missed",
              value: missed,
              pct: Math.round((missed / total) * 100),
            },
            {
              key: "cancelled",
              label: "Cancelled",
              value: cancelled,
              pct: Math.round((cancelled / total) * 100),
            },
          ];
        })(),
      },
      highlights,
      hospital_insights: {
        top_diseases,
        high_risk_patients,
        recovery_trend: weekly,
        adherence_trend: weekly,
        readmission_trend: weekly,
      },
      doctor_performance: buildDoctorPerformance(all, store.appointments),
      hospitals: buildHospitals(),
      weekly_summary,
      filter_options: {
        diseases: [...new Set(all.flatMap((r) => r.conditions))].sort(),
        doctors: storeDoctors,
      },
      cohort_size: rows.length,
    };
  },

  buildReport(
    userId: string,
    kind: ReportKind,
    patientId?: string,
  ): ReportPayload {
    const bundle = this.getBundle(userId);
    const now = new Date().toISOString();
    const period =
      kind === "monthly"
        ? format(new Date(), "MMMM yyyy")
        : `Week of ${format(subDays(new Date(), 6), "MMM d")} – ${format(new Date(), "MMM d, yyyy")}`;

    const titles: Record<ReportKind, string> = {
      doctor: "Doctor Performance Report",
      patient: "Patient Recovery Report",
      hospital: "Hospital Insights Report",
      weekly: "Weekly Executive Summary",
      monthly: "Monthly Executive Summary",
    };

    const kpis = bundle.kpis.map((k) => ({
      label: k.label,
      value:
        k.unit === "count"
          ? String(k.value)
          : k.unit === "percent"
            ? `${k.value}%`
            : `${k.value}`,
    }));

    const tables: ReportPayload["tables"] = [
      {
        title: "Patients requiring attention",
        headers: ["Patient", "Risk", "Recovery", "Reason"],
        rows: bundle.hospital_insights.high_risk_patients.map((p) => [
          p.full_name,
          p.risk,
          String(p.recovery_score),
          p.reason,
        ]),
      },
      {
        title: "Top diseases",
        headers: ["Disease", "Patients"],
        rows: bundle.hospital_insights.top_diseases.map((d) => [
          d.name,
          String(d.count),
        ]),
      },
      {
        title: "Doctor performance (demo)",
        headers: [
          "Doctor",
          "Patients",
          "Avg recovery",
          "Follow-up %",
          "Engagement",
        ],
        rows: bundle.doctor_performance.map((d) => [
          d.doctor_name,
          String(d.patients_managed),
          String(d.average_recovery),
          `${d.followup_rate}%`,
          `${d.patient_engagement}%`,
        ]),
      },
    ];

    if (kind === "patient" && patientId) {
      const row = bundle.hospital_insights.high_risk_patients.find(
        (p) => p.patient_id === patientId,
      );
      const patient =
        doctorRepository.listPatients(userId).find((p) => p.id === patientId) ||
        null;
      tables.unshift({
        title: "Patient snapshot",
        headers: ["Field", "Value"],
        rows: [
          ["Name", patient?.full_name || row?.full_name || patientId],
          ["Risk", row?.risk || "—"],
          ["Recovery", String(row?.recovery_score ?? "—")],
          ["Focus", row?.reason || "See Intelligence Center for live detail"],
        ],
      });
    }

    return {
      kind,
      title: titles[kind],
      generated_at: now,
      period_label: period,
      ai_summary: `${bundle.weekly_summary.headline} ${bundle.weekly_summary.bullets.join(" ")}`,
      key_insights: bundle.highlights.map((h) => h.text),
      recommendations: bundle.weekly_summary.recommendations,
      kpis,
      tables,
    };
  },
};
