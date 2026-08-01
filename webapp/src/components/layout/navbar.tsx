import { ChevronDown, LogOut, Menu, Moon, PanelLeft, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { HealNexusLogo } from "@/components/brand/logo";
import { NotificationsPopover } from "@/components/layout/notifications-popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useShell } from "@/contexts/shell-context";
import { useTheme } from "@/contexts/theme-context";
import { useAppLocale } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

interface NavbarProps {
  title?: string;
}

export function Navbar({ title }: NavbarProps) {
  const { user, logout, isDemoMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { setMobileOpen, toggleCollapsed } = useShell();
  const { t } = useAppLocale();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const roleLabel =
    user?.role === "patient"
      ? t("role_patient")
      : user?.role === "doctor"
        ? t("role_doctor")
        : user?.role === "caregiver"
          ? t("role_caregiver")
          : t("role_health_worker");

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onPointer = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-card/75 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={toggleCollapsed}
            aria-label={t("toggle_sidebar")}
            title={t("toggle_sidebar")}
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="md:hidden">
            <HealNexusLogo compact />
          </div>
          {title ? (
            <p className="hidden truncate text-sm font-semibold text-foreground md:block">
              {title}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" compact />

          {isDemoMode ? (
            <span className="inline-flex items-center rounded-full bg-[#22C55E] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
              {t("live")}
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

          <NotificationsPopover />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-2xl border border-border/80 bg-background/90 py-1 pl-1 pr-2 transition hover:border-primary/30 sm:pr-3"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0F766E] text-xs font-bold text-white">
                {(user?.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-[120px] truncate text-sm font-semibold leading-tight">
                  {user?.full_name}
                </span>
                <span className="block text-[11px] text-muted-foreground">
                  {roleLabel}
                </span>
              </span>
              <ChevronDown
                className={cn(
                  "hidden h-3.5 w-3.5 text-muted-foreground transition sm:block",
                  menuOpen && "rotate-180",
                )}
              />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 overflow-hidden rounded-2xl border border-border/80 bg-white p-2 shadow-[0_12px_40px_rgba(15,23,42,0.12)]"
              >
                <p className="px-2.5 py-1.5 text-xs font-bold text-[#0F172A]">
                  {t("account")}
                </p>
                <div className="mx-1 mb-1 border-t border-border/70" />
                <div className="px-1 py-1 sm:hidden">
                  <LanguageSwitcher />
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-semibold text-[#E11D48] transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t("sign_out")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
