import { Globe, Mail, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

import { HealNexusLogo } from "@/components/brand/logo";

const QUICK = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Sign In", href: "/login" },
];

const SOCIAL = [
  { icon: Share2, label: "Social" },
  { icon: MessageCircle, label: "Community" },
  { icon: Globe, label: "Website" },
  { icon: Mail, label: "Email" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/80 bg-card/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <HealNexusLogo showTagline />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Connecting Patients, Doctors &amp; AI Beyond Hospital Walls —
            continuity of care with clinicians in control.
          </p>
          <div className="mt-5 flex gap-2">
            {SOCIAL.map(({ icon: Icon, label }) => (
              <Link
                key={label}
                to="/contact"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:text-primary"
                aria-label={label}
              >
                <Icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="text-label">Quick links</p>
          <ul className="mt-3 space-y-2 text-sm">
            {QUICK.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className="text-muted-foreground transition hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-label">Legal</p>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-foreground">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/70 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HealNexus. All rights reserved. Demo
        product — assistive AI, never a substitute for clinical judgement.
      </div>
    </footer>
  );
}
