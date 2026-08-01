import {
  Activity,
  Brain,
  HeartPulse,
  Hospital,
  IdCard,
  LayoutDashboard,
  LineChart,
  Stethoscope,
  Users,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

export const FEATURES: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Brain,
    title: "AI Care Companion",
    description:
      "Educates, organizes, and monitors recovery — never diagnoses or prescribes.",
  },
  {
    icon: Activity,
    title: "Health Intelligence Engine",
    description:
      "Turns check-ins, vitals, and adherence into clear, actionable insights.",
  },
  {
    icon: HeartPulse,
    title: "Recovery Score",
    description:
      "A living score clinicians and families can understand at a glance.",
  },
  {
    icon: LineChart,
    title: "Readmission Prediction",
    description:
      "Surface rising risk early so teams can intervene before crisis.",
  },
  {
    icon: IdCard,
    title: "Patient Passport",
    description:
      "A portable health identity with emergency-ready access when it matters.",
  },
  {
    icon: Hospital,
    title: "PM-JAY Guidance",
    description:
      "Conversational help navigating benefits and empanelled hospitals.",
  },
  {
    icon: Stethoscope,
    title: "Rural Healthcare",
    description:
      "Field workflows for health workers screening and visiting communities.",
  },
  {
    icon: WifiOff,
    title: "Offline Support",
    description:
      "Capture care data without connectivity — sync when you’re back online.",
  },
  {
    icon: LayoutDashboard,
    title: "Doctor Dashboard",
    description:
      "A priority queue that shows who needs attention, why, and what to do.",
  },
  {
    icon: Users,
    title: "Caregiver Portal",
    description:
      "Keep families informed with status, alerts, and adherence visibility.",
  },
];

export const HOW_IT_WORKS = [
  { title: "Hospital Discharge", detail: "Care journey begins with a structured handoff." },
  { title: "AI Care Plan", detail: "Companion organizes tasks, meds, and education." },
  { title: "Daily Recovery Tracking", detail: "Check-ins and adherence feed live signals." },
  { title: "Health Intelligence", detail: "Risk, trends, and recovery become visible." },
  { title: "Doctor Monitoring", detail: "Clinicians act on a prioritized attention queue." },
  { title: "Reduced Readmissions", detail: "Earlier intervention, better continuity." },
];

export const WHY_ROWS = [
  {
    traditional: "Sporadic phone follow-ups",
    healnexus: "Continuous monitoring after discharge",
  },
  {
    traditional: "Fragmented notes & paper trails",
    healnexus: "AI insights with clinician control",
  },
  {
    traditional: "Risk spotted too late",
    healnexus: "Early risk detection & alerts",
  },
  {
    traditional: "Patients left guessing next steps",
    healnexus: "Clear engagement & daily guidance",
  },
  {
    traditional: "Scheme navigation is confusing",
    healnexus: "PM-JAY & benefits assistance",
  },
];

export const PRICING = [
  {
    id: "starter",
    name: "Starter",
    price: "₹0",
    period: "demo",
    blurb: "Explore the product with sample cohorts.",
    featured: false,
    features: [
      "Doctor Intelligence Center",
      "Patient check-ins",
      "Recovery Score (demo)",
      "Ahmedabad hospital map",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    price: "₹4,999",
    period: "/mo",
    blurb: "For clinics ready for live continuity workflows.",
    featured: true,
    features: [
      "Everything in Starter",
      "Priority patient queue",
      "Executive analytics",
      "Caregiver visibility",
      "Offline rural sync",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    blurb: "Hospital networks & government partnerships.",
    featured: false,
    features: [
      "Everything in Professional",
      "SSO & advanced security",
      "Multi-hospital rollouts",
      "Custom integrations",
      "Dedicated success team",
    ],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "The priority queue finally shows me who needs a call today — not after something goes wrong.",
    name: "Dr. Ananya Mehta",
    role: "Internal Medicine, Ahmedabad",
    initials: "AM",
  },
  {
    quote:
      "Daily check-ins and medicine reminders made recovery feel manageable after my discharge.",
    name: "Asha Patel",
    role: "Patient",
    initials: "AP",
  },
  {
    quote:
      "I can see when my mother’s adherence slips and escalate early. That peace of mind matters.",
    name: "Priya Shah",
    role: "Caregiver",
    initials: "PS",
  },
];

export const FAQS = [
  {
    q: "Is my data secure?",
    a: "HealNexus is designed with role-based access and privacy-first defaults. Demo mode stores data locally in your browser; production deployments use Supabase with secure authentication.",
  },
  {
    q: "Does AI replace doctors?",
    a: "No. The AI Care Companion assists with organization, education, and monitoring. Clinicians remain in control — HealNexus never diagnoses or prescribes.",
  },
  {
    q: "Can I use HealNexus offline?",
    a: "Yes for rural health workers. Field data can be captured offline and synced when connectivity returns.",
  },
  {
    q: "Is PM-JAY supported?",
    a: "HealNexus includes conversational PM-JAY guidance and an Ahmedabad hospital map highlighting empanelled centres for demo exploration.",
  },
  {
    q: "What is the Patient Passport?",
    a: "A digital health identity wallet with medical summary, emergency QR access, and government scheme context — built for continuity beyond hospital walls.",
  },
];

export const TRUSTED = [
  "Civil Hospital",
  "SVP Network",
  "LG Clinics",
  "Rural PHC Demo",
  "CareBridge Trust",
  "Arogya Partners",
];
