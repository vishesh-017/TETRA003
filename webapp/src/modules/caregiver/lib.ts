import type { AlertPriority, CareStatus, MedicineState, TimelineState } from "./types";

export function greetingPrefix() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function statusTone(status: CareStatus) {
  if (status === "stable")
    return {
      chip: "bg-emerald-500/15 text-emerald-800 ring-emerald-500/20",
      glow: "from-emerald-400/25 via-sky-300/10 to-transparent",
      ring: "#10B981",
    };
  if (status === "needs_attention")
    return {
      chip: "bg-amber-500/15 text-amber-900 ring-amber-500/25",
      glow: "from-amber-400/30 via-rose-300/10 to-transparent",
      ring: "#F59E0B",
    };
  return {
    chip: "bg-rose-500/15 text-rose-900 ring-rose-500/25",
    glow: "from-rose-400/30 via-orange-300/10 to-transparent",
    ring: "#EF4444",
  };
}

export function alertTone(priority: AlertPriority) {
  switch (priority) {
    case "critical":
      return "border-rose-300/80 bg-rose-50 text-rose-950";
    case "high":
      return "border-orange-300/80 bg-orange-50 text-orange-950";
    case "medium":
      return "border-amber-300/70 bg-amber-50/80 text-amber-950";
    default:
      return "border-sky-200 bg-sky-50/80 text-sky-950";
  }
}

export function timelineIconState(state: TimelineState) {
  switch (state) {
    case "done":
      return "bg-emerald-500 text-white";
    case "warning":
      return "bg-amber-500 text-white";
    case "pending":
      return "bg-sky-500 text-white";
    default:
      return "bg-slate-200 text-slate-600";
  }
}

export function medicineStateLabel(state: MedicineState) {
  switch (state) {
    case "taken":
      return "Taken";
    case "skipped":
      return "Skipped";
    case "missed":
      return "Missed";
    default:
      return "Pending";
  }
}

export function medicineStateClass(state: MedicineState) {
  switch (state) {
    case "taken":
      return "bg-emerald-500/15 text-emerald-800";
    case "skipped":
      return "bg-slate-200 text-slate-700";
    case "missed":
      return "bg-rose-500/15 text-rose-800";
    default:
      return "bg-amber-500/15 text-amber-900";
  }
}

export function vitalGlyph(status: "ok" | "pending" | "alert") {
  if (status === "ok") return "✔";
  if (status === "alert") return "!";
  return "·";
}
