import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
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
import { env } from "@/config/env";
import { useAuth } from "@/contexts/auth-context";
import { roleHomePath } from "@/services/auth.service";
import type { UserRole } from "@/types";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const DEMO_ROLES: Array<{ role: UserRole; label: string }> = [
  { role: "doctor", label: "Doctor" },
  { role: "patient", label: "Patient" },
  { role: "caregiver", label: "Caregiver" },
  { role: "health_worker", label: "Health Worker" },
];

export function LoginPage() {
  const { login, loginDemo, isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (!isLoading && isAuthenticated && user) {
    return <Navigate to={roleHomePath(user.role)} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await login(values);
      navigate("/");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in",
      );
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-display text-2xl">Sign in</CardTitle>
        <CardDescription>
          Access your HealNexus workspace with Supabase Auth
          {!env.isSupabaseConfigured
            ? ", or explore the scaffold with demo roles"
            : ""}
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@hospital.org"
              disabled={!env.isSupabaseConfigured || isSubmitting}
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={!env.isSupabaseConfigured || isSubmitting}
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>

          {formError ? (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={!env.isSupabaseConfigured || isSubmitting}
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Demo role entry
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ROLES.map((item) => (
              <Button
                key={item.role}
                variant="outline"
                onClick={() => {
                  loginDemo(item.role);
                  navigate(roleHomePath(item.role));
                }}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
