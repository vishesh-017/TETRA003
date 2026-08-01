import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  type Location,
} from "react-router-dom";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/services/auth.service";
import type { UserRole } from "@/types";

const loginSchema = z.object({
  email: z.string().min(2, "Enter User ID or email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ROLES: Array<{ role: UserRole; label: string }> = [
  { role: "doctor", label: "Dr. Ananya · Doctor" },
  { role: "patient", label: "Asha · Patient" },
  { role: "caregiver", label: "Priya · Caregiver" },
  { role: "health_worker", label: "Kavita · Health Worker" },
  { role: "admin", label: "Admin" },
];

function redirectTarget(
  from: Location | undefined,
  role: UserRole | undefined,
): string {
  if (from?.pathname && from.pathname !== "/login" && from.pathname !== "/signup") {
    return `${from.pathname}${from.search || ""}`;
  }
  return role ? roleHomePath(role) : "/app";
}

export function LoginPage() {
  const {
    login,
    loginDemo,
    loginCaregiverInvite,
    isAuthenticated,
    user,
    isLoading,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: Location } | null)?.from;
  const [formError, setFormError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={redirectTarget(from, user.role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate("/app", { replace: true });
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in",
      );
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with User ID + password (admin-created or demo), or explore
          with a live role.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">User ID or email</Label>
            <Input
              id="email"
              autoComplete="username"
              placeholder="asha.patel or you@hospital.org"
              disabled={isSubmitting}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Demo seed: <span className="font-mono">asha.patel</span> /{" "}
              <span className="font-mono">demo123</span>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Live role entry
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((item) => (
              <Button
                key={item.role}
                variant="outline"
                onClick={() => {
                  loginDemo(item.role);
                  navigate(redirectTarget(from, item.role), { replace: true });
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-teal-100 bg-teal-50/50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-900/70">
            Caregiver invite
          </p>
          <p className="text-sm text-muted-foreground">
            Patients can add you from Profile → My caregivers. Enter the invite
            unique code they shared (seed example:{" "}
            <span className="font-mono">CG-A7F3C91B-2E4D</span>).
          </p>
          <div className="flex gap-2">
            <Input
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value.toUpperCase());
                setInviteError(null);
              }}
              placeholder="INVITE-CODE"
              className="font-mono uppercase"
              aria-label="Caregiver invite code"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                try {
                  loginCaregiverInvite(inviteCode);
                  navigate("/caregiver", { replace: true });
                } catch (error) {
                  setInviteError(
                    error instanceof Error
                      ? error.message
                      : "Invalid invite code",
                  );
                }
              }}
            >
              Open
            </Button>
          </div>
          {inviteError ? (
            <p className="text-xs text-destructive">{inviteError}</p>
          ) : null}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Get Started
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
