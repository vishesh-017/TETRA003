import { motion } from "framer-motion";
import { MapPinned, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FamilySwitcher } from "@/modules/caregiver/components/family-switcher";
import { useCaregiver } from "@/modules/caregiver/context";

const NEARBY = [
  {
    name: "Civil Hospital Ahmedabad",
    distance: "4.2 km",
    eta: "14 min",
    phone: "+91 79 2268 0201",
    type: "Government · Trauma ready",
  },
  {
    name: "UN Mehta Institute of Cardiology",
    distance: "5.1 km",
    eta: "18 min",
    phone: "+91 79 2268 2200",
    type: "Cardiac specialty",
  },
  {
    name: "SVP Hospital",
    distance: "6.4 km",
    eta: "22 min",
    phone: "+91 79 2268 3700",
    type: "Multi-specialty",
  },
];

export function CaregiverHospitalsPage() {
  const { selected, emergency } = useCaregiver();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Hospitals
        </p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Care near {selected.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Primary hospital: {emergency.hospitalName}
        </p>
      </motion.div>
      <FamilySwitcher />

      <div className="space-y-3">
        {NEARBY.map((h, i) => (
          <motion.article
            key={h.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold">{h.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{h.type}</p>
              </div>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                {h.distance} · {h.eta}
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={`tel:${h.phone.replace(/\s/g, "")}`}
                className={cn(buttonVariants({ size: "sm" }))}
              >
                Call
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(h.name)}`}
                target="_blank"
                rel="noreferrer"
                className={cn(buttonVariants({ size: "sm", variant: "secondary" }))}
              >
                <Navigation className="mr-1.5 h-3.5 w-3.5" />
                Directions
              </a>
            </div>
          </motion.article>
        ))}
      </div>

      <Link
        to="/maps"
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-12 justify-center gap-2 rounded-2xl",
        )}
      >
        <MapPinned className="h-4 w-4" />
        Open full hospital map
      </Link>
    </div>
  );
}
