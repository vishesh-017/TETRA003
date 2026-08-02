import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import type { MouseEvent } from "react";
import QRCode from "react-qr-code";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PassportPreviewData } from "@/modules/caregiver/types";

export function PassportTiltCard({
  passport,
  href = "/caregiver/passport#full-passport",
  onOpenFull,
}: {
  passport: PassportPreviewData;
  href?: string;
  /** Prefer this over navigation when already on the passport page. */
  onOpenFull?: () => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useMotionValue(0), { stiffness: 200, damping: 20 });
  const glare = useMotionTemplate`radial-gradient(420px circle at ${x}px ${y}px, rgba(255,255,255,0.28), transparent 45%)`;

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    x.set(px);
    y.set(py);
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    rotateX.set(((py - midY) / midY) * -8);
    rotateY.set(((px - midX) / midX) * 10);
  }

  function onLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative [perspective:1000px]"
    >
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0B3B5A] via-[#125A7A] to-[#0F766E] p-5 text-white shadow-lift">
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={{ background: glare }}
        />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              Patient Passport
            </div>
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight">
              {passport.name}
            </h3>
            <p className="mt-1 font-mono text-xs text-teal-100">{passport.abhaId}</p>
          </div>
          <div className="rounded-xl bg-white p-2 shadow-soft">
            <QRCode value={passport.qrValue} size={72} />
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-2 gap-3 text-sm">
          <Field label="Blood Group" value={passport.bloodGroup} />
          <Field
            label="Emergency"
            value={`${passport.emergencyContact}`}
            sub={passport.emergencyPhone}
          />
          <Field
            label="Allergies"
            value={passport.allergies.join(", ")}
            className="col-span-2"
          />
          <Field
            label="Medicines"
            value={passport.medicines.join(" · ")}
            className="col-span-2"
          />
        </div>

        {onOpenFull ? (
          <button
            type="button"
            onClick={onOpenFull}
            className={cn(
              buttonVariants({ size: "sm" }),
              "relative mt-5 w-full border-0 bg-white text-slate-900 hover:bg-white/90",
            )}
          >
            Open full passport
          </button>
        ) : (
          <Link
            to={href}
            className={cn(
              buttonVariants({ size: "sm" }),
              "relative mt-5 w-full border-0 bg-white text-slate-900 hover:bg-white/90",
            )}
          >
            Open full passport
          </Link>
        )}
      </div>
    </motion.div>
  );
}

function Field({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-[11px] uppercase tracking-[0.12em] text-white/60">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
      {sub ? <p className="text-xs text-teal-100">{sub}</p> : null}
    </div>
  );
}
