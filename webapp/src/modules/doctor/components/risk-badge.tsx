import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/modules/doctor/types";

const variantMap: Record<
  RiskLevel,
  "default" | "secondary" | "warning" | "destructive" | "outline"
> = {
  low: "secondary",
  moderate: "warning",
  high: "destructive",
  critical: "destructive",
};

export function RiskBadge({ level }: { level?: RiskLevel | null }) {
  if (!level) return <Badge variant="outline">NA</Badge>;
  return (
    <Badge variant={variantMap[level]} className="capitalize">
      {level}
    </Badge>
  );
}
