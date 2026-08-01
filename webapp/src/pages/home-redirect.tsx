import { Navigate } from "react-router-dom";

import { LoadingScreen } from "@/components/feedback/loading-screen";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/services/auth.service";

export function HomeRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHomePath(user.role)} replace />;
}
