import { QrCode } from "lucide-react";
import { Link } from "react-router-dom";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PassportView } from "@/modules/patient/types";

export function PassportPreview({ passport }: { passport: PassportView }) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 via-card to-secondary/10">
      <CardHeader className="flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Patient Passport</CardTitle>
          <p className="text-sm text-muted-foreground">Compact emergency preview</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-primary/40 bg-background/80">
          <QrCode className="h-7 w-7 text-primary" aria-hidden />
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Blood group</p>
            <p className="font-medium">{passport.blood_group || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ABHA Demo ID</p>
            <p className="font-medium">{passport.abha_id_demo || "—"}</p>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Allergies</p>
          <p className="font-medium">
            {passport.allergies.length ? passport.allergies.join(", ") : "None recorded"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Current medicines</p>
          <p className="font-medium">
            {passport.current_medicines.map((m) => m.name).join(", ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Emergency contact</p>
          <p className="font-medium">
            {passport.emergency_contact?.name || "—"}{" "}
            {passport.emergency_contact?.phone
              ? `· ${passport.emergency_contact.phone}`
              : ""}
          </p>
        </div>
        <Link
          to="/patient/passport"
          className={cn(buttonVariants(), "w-full sm:w-auto")}
        >
          View Full Passport
        </Link>
      </CardContent>
    </Card>
  );
}
