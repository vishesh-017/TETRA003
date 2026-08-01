import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PassportView } from "@/modules/patient/types";

export function PassportPreview({ passport }: { passport: PassportView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-3xl wallet-shine p-px shadow-soft"
    >
      <div className="rounded-[1.4rem] bg-gradient-to-b from-white/15 to-black/10 p-4 text-white">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/75">
          <ShieldCheck className="h-3.5 w-3.5" />
          Health Passport
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="text-white/65">Blood</p>
            <p className="font-semibold">{passport.blood_group || "—"}</p>
          </div>
          <div>
            <p className="text-white/65">ABHA</p>
            <p className="truncate font-mono text-xs font-semibold">
              {passport.abha_id_demo || "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-white/65">Allergies</p>
            <p className="font-medium">
              {passport.allergies.length
                ? passport.allergies.join(", ")
                : "None"}
            </p>
          </div>
        </div>
        <Link
          to="/patient/passport"
          className={cn(
            buttonVariants({ size: "sm" }),
            "mt-4 w-full border-0 bg-white text-primary hover:bg-white/90",
          )}
        >
          Open Passport
        </Link>
      </div>
    </motion.div>
  );
}
