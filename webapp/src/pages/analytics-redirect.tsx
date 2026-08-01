import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/auth-context";
import { ModulePlaceholder } from "@/pages/module-placeholder";

export function AnalyticsRedirect() {
  const { user } = useAuth();
  if (user?.role === "doctor") {
    return <Navigate to="/doctor/analytics" replace />;
  }
  return (
    <ModulePlaceholder
      title="Analytics"
      description="Recovery, adherence, and risk trends appear in the Doctor Intelligence Center."
      showAiDisclaimer
    />
  );
}
