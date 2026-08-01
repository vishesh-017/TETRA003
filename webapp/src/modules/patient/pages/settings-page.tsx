import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import {
  usePatientMutations,
  usePatientProfile,
} from "@/modules/patient/hooks";
import { resetStore } from "@/data/store";

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const profile = usePatientProfile();
  const { updateProfile } = usePatientMutations();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 pb-10">
      <div>
        <h1 className="font-display text-3xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Appearance, language, notifications, and account.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dark mode</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => setTheme("light")}
          >
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => setTheme("dark")}
          >
            Dark
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
            value={profile.data?.preferred_language || "en"}
            onChange={(e) =>
              updateProfile.mutate({ preferred_language: e.target.value })
            }
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="gu">Gujarati</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demo data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Reset the local dynamic store back to the fresh demo seed.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              resetStore();
              window.location.reload();
            }}
          >
            Reset demo data
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={async () => {
              await logout();
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
