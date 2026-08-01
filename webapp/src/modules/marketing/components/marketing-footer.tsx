import { Globe, Mail, MessageCircle, Share2 } from "lucide-react";
import { Link } from "react-router-dom";

import { HealNexusMark } from "@/components/brand/logo";

const PRODUCT = [
  { label: "Features", href: "/#features" },
  { label: "How it Works", href: "/#how-it-works" },
  { label: "For Doctors", href: "/#for-doctors" },
  { label: "For Patients", href: "/#for-patients" },
  { label: "Pricing", href: "/pricing" },
];

const COMPANY = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/about" },
  { label: "GitHub", href: "https://github.com", external: true },
];

const SOCIAL = [
  { icon: Share2, label: "Social", href: "/contact" },
  { icon: MessageCircle, label: "Community", href: "/contact" },
  { icon: Globe, label: "Website", href: "/" },
  { icon: Mail, label: "Email", href: "/contact" },
];

export function MarketingFooter() {
  return (
    <footer className="border-t border-[#0F172A]/06 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2.5">
            <HealNexusMark size={36} className="rounded-xl" />
            <span className="font-display text-lg font-bold text-[#0F172A]">
              HealNexus
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[#64748B]">
            AI-Powered Continuity of Care Platform — connecting patients,
            doctors, and hospitals beyond discharge.
          </p>
          <div className="mt-6 flex gap-2">
            {SOCIAL.map(({ icon: Icon, label, href }) =>
              href.startsWith("http") ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0F172A]/08 text-[#64748B] transition hover:border-[#2563EB]/30 hover:text-[#2563EB]"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ) : (
                <Link
                  key={label}
                  to={href}
                  aria-label={label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#0F172A]/08 text-[#64748B] transition hover:border-[#2563EB]/30 hover:text-[#2563EB]"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ),
            )}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PRODUCT.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  to={item.href}
                  className="text-[#64748B] transition hover:text-[#0F172A]"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
            Company
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {COMPANY.map((item) =>
              item.external ? (
                <li key={item.label}>
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#64748B] transition hover:text-[#0F172A]"
                  >
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.label}>
                  <Link
                    to={item.href}
                    className="text-[#64748B] transition hover:text-[#0F172A]"
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-[#0F172A]/06 py-5 text-center text-xs text-[#94A3B8]">
        © {new Date().getFullYear()} HealNexus. Assistive AI only — never a
        substitute for clinical judgement.
      </div>
    </footer>
  );
}
