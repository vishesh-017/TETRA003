import { Navigate, useNavigate, Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/services/auth.service";
import type { UserRole } from "@/types";

const DEMO_ROLES: Array<{ role: UserRole; label: string; blurb: string }> = [
  {
    role: "doctor",
    label: "Doctor",
    blurb: "Intelligence Center, analytics, follow-ups",
  },
  {
    role: "patient",
    label: "Patient",
    blurb: "Check-ins, medicines, recovery score",
  },
  {
    role: "caregiver",
    label: "Caregiver",
    blurb: "Status visibility and alert support",
  },
  {
    role: "health_worker",
    label: "Health Worker",
    blurb: "Rural screening, visits, offline sync",
  },
];

export function SignupPage() {
  const { loginDemo, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Get started</CardTitle>
        <CardDescription>
          Choose a demo workspace to explore HealNexus instantly. Full account
          signup is available via Sign In when Supabase Auth is configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          {DEMO_ROLES.map((item) => (
            <Button
              key={item.role}
              variant="outline"
              className="h-auto justify-start px-4 py-3 text-left"
              onClick={() => {
                loginDemo(item.role);
                navigate(roleHomePath(item.role));
              }}
            >
              <span>
                <span className="block font-semibold">{item.label}</span>
                <span className="block text-xs font-normal text-muted-foreground">
                  {item.blurb}
                </span>
              </span>
            </Button>
          ))}
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Already exploring?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
          {" · "}
          <Link to="/" className="font-semibold text-primary hover:underline">
            Home
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
