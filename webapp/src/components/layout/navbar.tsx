import { Bell, LogOut, Menu, Moon, Sun } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { HealNexusLogo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useShell } from "@/contexts/shell-context";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setMobileOpen } = useShell();
  const navigate = useNavigate();

  const notificationsHref =
    user?.role === "patient"
      ? "/patient/notifications"
      : user?.role === "health_worker"
        ? "/rural/notifications"
        : user?.role === "caregiver"
          ? "/caregiver/alerts"
          : "/doctor";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/75 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="md:hidden">
            <HealNexusLogo compact />
          </div>
          {title ? (
            <p className="hidden truncate text-sm font-semibold text-foreground md:block">
              {title}
            </p>
          ) : (
            <p className="hidden text-sm text-muted-foreground md:block">
              Press{" "}
              <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                [
              </kbd>{" "}
              to toggle sidebar
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {isDemoMode ? (
            <span className="hidden rounded-full border border-warning/30 bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground sm:inline">
              Demo
            </span>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={
              theme === "light" ? "Switch to dark theme" : "Switch to light theme"
            }
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
          <Link
            to={notificationsHref}
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            aria-label="Open notifications"
          >
            <Bell className="h-4 w-4" />
          </Link>
          <div
            className={cn(
              "hidden items-center gap-3 rounded-2xl border border-border/80 bg-background/80 px-3 py-1.5 sm:flex",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
              {(user?.full_name || "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight">
                {user?.full_name}
              </p>
              <p className="text-[11px] capitalize text-muted-foreground">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="sm:hidden"
            aria-label="Logout"
            onClick={() => void handleLogout()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
