import { Bell, Menu, Moon, Sun } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { env } from "@/config/env";

interface NavbarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Navbar({ onMenuClick, title }: NavbarProps) {
  const { user, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex items-center gap-3">
          {onMenuClick ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onMenuClick}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          ) : null}
          <div>
            <Link to="/" className="font-display text-lg font-semibold text-primary md:hidden">
              {env.appName}
            </Link>
            {title ? (
              <p className="hidden text-sm font-medium text-foreground md:block">{title}</p>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode ? (
            <span className="hidden rounded-lg bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning-foreground sm:inline">
              Demo mode
            </span>
          ) : null}
          <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Bell className="h-4 w-4" />
          </Button>
          <div className="hidden items-center gap-3 rounded-xl border border-border bg-background px-3 py-1.5 sm:flex">
            <div className="text-right">
              <p className="text-sm font-medium leading-tight">{user?.full_name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {user?.role?.replace("_", " ")}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
