import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { HealNexusMark } from "@/components/brand/logo";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { roleHomePath } from "@/services/auth.service";

const LINKS = [
  { label: "Home", href: "/#home" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "For Doctors", href: "/#for-doctors" },
  { label: "For Patients", href: "/#for-patients" },
  { label: "About", href: "/about" },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  const primaryHref =
    isAuthenticated && user ? roleHomePath(user.role) : "/signup";
  const primaryLabel =
    isAuthenticated && user ? "Open dashboard" : "Get Started";

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-[#0F172A]/06 bg-[#F8FAFC]/75 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="HealNexus home">
          <HealNexusMark
            size={36}
            className="rounded-xl ring-1 ring-[#0F172A]/08"
          />
          <span className="font-display text-[17px] font-bold tracking-tight text-[#0F172A]">
            HealNexus
          </span>
        </Link>

        <nav
          className="hidden items-center gap-0.5 lg:flex"
          aria-label="Marketing"
        >
          {LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="rounded-xl px-3 py-2 text-[13px] font-medium text-[#64748B] transition hover:bg-white/70 hover:text-[#0F172A]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {isAuthenticated && user ? null : (
            <Link
              to="/login"
              className="rounded-xl px-3.5 py-2 text-[13px] font-semibold text-[#475569] transition hover:text-[#0F172A]"
            >
              Login
            </Link>
          )}
          <Link
            to={primaryHref}
            className="inline-flex h-10 items-center rounded-xl bg-[#2563EB] px-4 text-[13px] font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition hover:bg-[#1D4ED8]"
          >
            {primaryLabel}
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0F172A]/08 bg-white/80 lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-b border-[#0F172A]/06 bg-[#F8FAFC]/95 backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-[#0F172A] hover:bg-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 grid gap-2 border-t border-[#0F172A]/06 pt-3">
                {!isAuthenticated ? (
                  <Link
                    to="/login"
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-[#0F172A]/10 bg-white text-sm font-semibold"
                  >
                    Login
                  </Link>
                ) : null}
                <Link
                  to={primaryHref}
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-semibold text-white"
                >
                  {primaryLabel}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
