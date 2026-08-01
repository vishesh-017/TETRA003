import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Pill,
  TrendingUp,
} from "lucide-react";

const PATIENTS = [
  { name: "Asha Patel", risk: "High", score: 58, tone: "text-rose-600 bg-rose-50" },
  { name: "Ravi Mehta", risk: "Mod", score: 74, tone: "text-amber-600 bg-amber-50" },
  { name: "Fatima Khan", risk: "Low", score: 91, tone: "text-emerald-600 bg-emerald-50" },
  { name: "Kiran Shah", risk: "Low", score: 86, tone: "text-emerald-600 bg-emerald-50" },
];

const TREND = [42, 48, 45, 55, 58, 62, 68, 71, 74, 78, 82, 86];

export function HeroDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[540px] lg:max-w-none"
    >
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-[#2563EB]/20 via-[#14B8A6]/10 to-transparent blur-2xl" />

      <div className="hn-card-premium relative overflow-hidden rounded-[1.75rem] p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              Doctor workspace
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#0F172A]">
              Continuity Command Center
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#16A34A]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
            Live
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric
            icon={AlertTriangle}
            label="Readmission Risk"
            value="12%"
            hint="↓ 4% this week"
            accent="from-[#2563EB]/12 to-transparent"
          />
          <Metric
            icon={Activity}
            label="Recovery Score"
            value="84"
            hint="Cohort avg"
            accent="from-[#14B8A6]/15 to-transparent"
          />
          <Metric
            icon={CalendarDays}
            label="Follow-ups"
            value="18"
            hint="Due today"
            accent="from-[#22C55E]/12 to-transparent"
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1.35fr_1fr]">
          <div className="rounded-2xl border border-[#0F172A]/06 bg-[#F8FAFC] p-3.5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-[#2563EB]" />
                <p className="text-xs font-semibold text-[#0F172A]">
                  Recovery trend
                </p>
              </div>
              <p className="text-[11px] font-medium text-[#14B8A6]">+9.2%</p>
            </div>
            <TrendChart values={TREND} />
          </div>

          <div className="rounded-2xl border border-[#0F172A]/06 bg-[#F8FAFC] p-3.5">
            <div className="mb-3 flex items-center gap-2">
              <Pill className="h-3.5 w-3.5 text-[#14B8A6]" />
              <p className="text-xs font-semibold text-[#0F172A]">Adherence</p>
            </div>
            <div className="flex items-center gap-3">
              <AdherenceRing value={95} />
              <div>
                <p className="text-2xl font-bold tracking-tight text-[#0F172A]">
                  95%
                </p>
                <p className="text-[11px] leading-snug text-[#64748B]">
                  Medicine taken on schedule
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.1fr]">
          <div className="rounded-2xl border border-[#0F172A]/06 bg-white p-3.5">
            <p className="text-xs font-semibold text-[#0F172A]">Recent alerts</p>
            <ul className="mt-2.5 space-y-2">
              {[
                { t: "Missed check-in · Asha", s: "High", c: "bg-rose-500" },
                { t: "Pain spike · Ravi", s: "Watch", c: "bg-amber-500" },
                { t: "Labs due · Fatima", s: "Info", c: "bg-[#2563EB]" },
              ].map((a) => (
                <li
                  key={a.t}
                  className="flex items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-2 text-[#334155]">
                    <span className={`h-1.5 w-1.5 rounded-full ${a.c}`} />
                    {a.t}
                  </span>
                  <span className="font-medium text-[#64748B]">{a.s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#0F172A]/06 bg-white p-3.5">
            <p className="text-xs font-semibold text-[#0F172A]">Patients</p>
            <ul className="mt-2.5 space-y-2">
              {PATIENTS.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-[#14B8A6] text-[9px] font-bold text-white">
                      {p.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                    <span className="text-[11px] font-medium text-[#0F172A]">
                      {p.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${p.tone}`}
                    >
                      {p.risk}
                    </span>
                    <span className="w-6 text-right text-[11px] font-semibold text-[#0F172A]">
                      {p.score}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <motion.div
        className="hn-float absolute -left-3 top-16 hidden rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur sm:block"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
          AI insight
        </p>
        <p className="text-xs font-semibold text-[#0F172A]">
          Escalate Asha — risk rising
        </p>
      </motion.div>

      <motion.div
        className="hn-float-delay absolute -right-2 bottom-20 hidden rounded-2xl border border-white/70 bg-white/90 px-3 py-2 shadow-lg backdrop-blur md:block"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, delay: 0.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <p className="text-[10px] font-semibold text-[#14B8A6]">Adherence</p>
        <p className="text-sm font-bold text-[#0F172A]">95% this week</p>
      </motion.div>
    </motion.div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  hint,
  accent,
  className = "",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint: string;
  accent: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-[#0F172A]/06 bg-white p-3 ${className}`}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent}`}
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-center gap-1.5 text-[#64748B]">
          <Icon className="h-3.5 w-3.5" />
          <p className="text-[10px] font-semibold uppercase tracking-wide">
            {label}
          </p>
        </div>
        <p className="mt-1.5 text-2xl font-bold tracking-tight text-[#0F172A]">
          {value}
        </p>
        <p className="text-[10px] font-medium text-[#64748B]">{hint}</p>
      </div>
    </div>
  );
}

function TrendChart({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const w = 220;
  const h = 64;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / (max - min || 1)) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" aria-hidden>
      <defs>
        <linearGradient id="hnTrendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke="#2563EB"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
      <polygon
        fill="url(#hnTrendFill)"
        points={`0,${h} ${pts} ${w},${h}`}
      />
    </svg>
  );
}

function AdherenceRing({ value }: { value: number }) {
  const r = 28;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden>
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth="7"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="url(#hnRing)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
      />
      <defs>
        <linearGradient id="hnRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
