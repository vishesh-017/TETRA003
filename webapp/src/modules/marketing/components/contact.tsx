import { Mail, MapPin, Phone } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "@/modules/marketing/components/section";

export function ContactSection() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Talk with the HealNexus team"
      description="Live contact form — messages are acknowledged locally for product walkthroughs."
    >
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4 rounded-3xl border border-border/80 bg-card/70 p-6 shadow-soft">
          <ContactRow
            icon={Mail}
            label="Email"
            value="hello@healnexus.demo"
          />
          <ContactRow icon={Phone} label="Phone" value="+91 79 4000 1200" />
          <ContactRow
            icon={MapPin}
            label="Location"
            value="Ahmedabad, Gujarat, India"
          />
          <p className="pt-2 text-xs text-muted-foreground">
            For investor & hospital demos, use Get Started to explore role-based
            workspaces instantly.
          </p>
        </div>

        <form
          className="space-y-4 rounded-3xl border border-border/80 bg-card/70 p-6 shadow-soft"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitting(true);
            window.setTimeout(() => {
              setSubmitting(false);
              toast.success("Message received — thank you (live).");
              (e.target as HTMLFormElement).reset();
            }, 600);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" id="name">
              <Input id="name" name="name" required placeholder="Your name" />
            </Field>
            <Field label="Email" id="email">
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@hospital.org"
              />
            </Field>
          </div>
          <Field label="Message" id="message">
            <Textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Tell us about your hospital or care program…"
            />
          </Field>
          <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </div>
    </Section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
