import type {
  EduAudience,
  EduLesson,
  EduTopicId,
  EduTopicMeta,
} from "./types";

type Loc = Record<"en" | "hi" | "gu", string>;
type LocList = Record<"en" | "hi" | "gu", string[]>;

const L = (en: string, hi: string, gu: string): Loc => ({ en, hi, gu });
const A = (en: string): Loc => L(en, en, en);
const AB = (en: string[]): LocList => ({ en, hi: en, gu: en });

export const CAREGIVER_TOPICS: EduTopicMeta[] = [
  { id: "all", label: L("All topics", "Sabhi vishay", "Badha vishayo") },
  {
    id: "diabetes",
    label: L("Diabetes", "Madhumeh", "Madhumeh"),
    accent: "#EA580C",
  },
  { id: "bp", label: L("Blood pressure", "Blood pressure", "Blood pressure") },
  { id: "kidneys", label: L("Kidneys", "Gurde", "Kidni") },
  { id: "heart", label: L("Heart", "Hriday", "Hriday") },
  { id: "stroke", label: L("Stroke", "Stroke", "Stroke") },
  { id: "diet", label: L("Diet", "Aahar", "Aahar") },
  { id: "medicine", label: L("Medicines", "Dawaiyan", "Davao") },
  { id: "habits", label: L("Daily habits", "Roz ki aadaten", "Rojni tevo") },
  {
    id: "family",
    label: L("Family care", "Parivarik dekhbhal", "Parivarik sambhal"),
  },
  { id: "emergency", label: L("Emergency", "Apatkal", "Katokati") },
];

export const WORKER_TOPICS: EduTopicMeta[] = [
  { id: "all", label: L("All topics", "Sabhi vishay", "Badha vishayo") },
  {
    id: "screening",
    label: L("Camp screening", "Shivir janch", "Camp tapas"),
    accent: "#0F766E",
  },
  {
    id: "diabetes",
    label: L("Diabetes", "Madhumeh", "Madhumeh"),
    accent: "#EA580C",
  },
  { id: "bp", label: L("Blood pressure", "Blood pressure", "Blood pressure") },
  { id: "medicine", label: L("Adherence", "Dawa palan", "Dava palan") },
  { id: "diet", label: L("Diet counseling", "Aahar salah", "Aahar salah") },
  { id: "adherence", label: L("Follow-up", "Follow-up", "Follow-up") },
  {
    id: "emergency",
    label: L("Field emergency", "Maidani apat", "Field katokati"),
  },
  {
    id: "habits",
    label: L("Village habits", "Gaon ki aadaten", "Gamni tevo"),
  },
];

const CAREGIVER_LESSONS: EduLesson[] = [
  {
    id: "cg-dm-video",
    topics: ["diabetes"],
    kind: "tip",
    title: A(
      "Understanding Type 2 diabetes — what families need to know",
    ),
    body: A(
      "Learn how sugar builds up in the blood, why medicines and food both matter, and which warning signs mean you should call the doctor today. Read this with your family member so everyone knows the plan.",
    ),
  },
  {
    id: "cg-dm-diet",
    topics: ["diabetes", "diet"],
    kind: "diet",
    title: A("Home plate for Type 2 diabetes (caregiver guide)"),
    body: A(
      "Build every main meal as: half the plate vegetables, one quarter dal/eggs/paneer/chicken, one quarter roti or brown rice. Skip sugary drinks, bakery snacks, and late-night sweets. Offer water or buttermilk instead of cola.",
    ),
    bullets: AB([
      "Keep meal times steady — same breakfast / lunch / dinner window each day",
      "If sugar reading is high after a meal, note what was eaten and tell the doctor",
      "Fruit is fine in small portions (one banana or apple) — not fruit juice packs",
      "When cooking for the family, use less oil and salt for everyone's plate",
    ]),
  },
  {
    id: "cg-bp-video",
    topics: ["bp"],
    kind: "tip",
    title: A("How to check blood pressure at home — step by step"),
    body: A(
      "Sit quietly for 5 minutes, feet on the floor, cuff on bare upper arm at heart level. Do not talk during the reading. Write both numbers (e.g. 138/86) in HealNexus or a notebook and share with the doctor.",
    ),
  },
  {
    id: "cg-bp-care",
    topics: ["bp", "family"],
    kind: "tip",
    title: A("Living with high BP — your daily caregiver checklist"),
    body: A(
      "High BP often has no pain — so routine matters more than feeling. Give BP medicines at the same time every day, reduce salt and papad/pickle, and watch for severe headache, chest pain, or sudden vision change.",
    ),
    bullets: AB([
      "Never stop BP medicine because readings look 'normal' one day",
      "Limit tea/coffee before a home BP check",
      "If systolic stays above 180 or there is chest pain — call 108",
    ]),
  },
  {
    id: "cg-kidney-diet",
    topics: ["kidneys", "diet", "diabetes"],
    kind: "diet",
    title: A("Protecting kidneys when sugar or BP is high"),
    body: A(
      "Kidneys are silently damaged by long high sugar and BP. Use less salt, avoid painkillers without advice, drink water as the doctor allows, and never miss follow-up lab tests (creatinine / urine).",
    ),
    bullets: AB([
      "Watch for swelling in feet, face, or sudden weight gain",
      "Ask before using salt substitutes or herbal powders",
      "Bring every lab report to the next clinic visit",
    ]),
  },
  {
    id: "cg-heart",
    topics: ["heart", "emergency"],
    kind: "tip",
    title: A("Heart warning signs families must never ignore"),
    body: A(
      "Pressure or pain in the chest, pain in the left arm or jaw, sudden heavy sweating, or severe breathlessness can be a heart emergency. Do not wait for it to 'settle' — call 108 and stay with the person.",
    ),
  },
  {
    id: "cg-stroke",
    topics: ["stroke", "emergency"],
    kind: "tip",
    title: A("FAST stroke signs — minutes save the brain"),
    body: A(
      "Face drooping, Arm weakness, Speech difficulty, Time to call 108. Note the exact time symptoms started. Do not give food, water, or medicines if the person cannot swallow safely.",
    ),
    bullets: AB([
      "Keep the person sitting or lying with head slightly raised",
      "Bring the medicine list and ABHA / passport to the hospital",
      "Even if symptoms improve, still get checked — TIAs warn of stroke",
    ]),
  },
  {
    id: "cg-meds",
    topics: ["medicine", "family"],
    kind: "tip",
    title: A("Helping with daily medicines without mistakes"),
    body: A(
      "Use a weekly pill box, set phone reminders, and tick doses in HealNexus. Never double a missed dose. If vomiting or diarrhoea starts after a new medicine, call the doctor before the next dose.",
    ),
  },
  {
    id: "cg-habits",
    topics: ["habits", "family"],
    kind: "tip",
    title: A("Daily habits that support your patient's recovery"),
    body: A(
      "Sleep by 10–11 pm, short walks after meals if the doctor allows, less late-night screen time, and calm shared meals. Celebrate small wins — a full medicine day or a stable sugar reading.",
    ),
    bullets: AB([
      "Keep a shared checklist on the fridge for morning / evening medicines",
      "Log sugar and BP in the app so the doctor sees the real trend",
      "Invite one more family member to learn the emergency numbers",
    ]),
  },
];

const WORKER_LESSONS: EduLesson[] = [
  {
    id: "hw-camp",
    topics: ["screening"],
    kind: "tip",
    title: A("Running a calm NCD screening camp in Ahmedabad"),
    body: A(
      "Register names first, then take each person's own BP, sugar, and SpO₂. Flag emergencies immediately. Use the camp dropdown (admin-created camps only). Sync when you are online — never invent camp names in the field.",
    ),
  },
  {
    id: "hw-bp",
    topics: ["bp", "screening"],
    kind: "tip",
    title: A("Field BP measurement — avoid wrong readings"),
    body: A(
      "Arm at heart level, correct cuff size, person silent and seated. Repeat if the first reading is very high. Log systolic and diastolic separately. Escalate when high BP comes with headache, chest pain, or breathlessness.",
    ),
  },
  {
    id: "hw-dm-counsel",
    topics: ["diabetes", "diet"],
    kind: "diet",
    title: A("2-minute village diet counseling after sugar screening"),
    body: A(
      "Show the plate with hand gestures: half sabzi, quarter protein, quarter roti/rice. Link advice to their reading today. Warn against sweet chai and fried snacks. Invite one family member to listen.",
    ),
    bullets: AB([
      "Use local foods — bajra, dal, seasonal sabzi — not expensive 'diet' products",
      "If fasting sugar is very high, mark for doctor follow-up the same week",
      "Give the medicine adherence tip before they leave the queue",
    ]),
  },
  {
    id: "hw-adherence",
    topics: ["adherence", "medicine"],
    kind: "tip",
    title: A("Medicine adherence after the camp — your follow-up job"),
    body: A(
      "Confirm who keeps the blister pack at home, set one reminder time, and schedule a home visit for high-risk homes. Optional portal username links the person to HealNexus when they already have an account.",
    ),
  },
  {
    id: "hw-emergency",
    topics: ["emergency"],
    kind: "tip",
    title: A("Field emergency before 108 arrives"),
    body: A(
      "Keep airway clear, note last vitals, do not give food/water if unconscious, stay with the person, and send one helper to guide the ambulance. Record the event in offline screening with emergency flag.",
    ),
    bullets: AB([
      "Chest pain + sweating + breathlessness = treat as heart emergency",
      "FAST signs = stroke pathway — note onset time",
      "Never leave a critical patient alone to 'finish the queue'",
    ]),
  },
  {
    id: "hw-habits",
    topics: ["habits"],
    kind: "tip",
    title: A("Habits to teach after every Ahmedabad camp"),
    body: A(
      "Morning walk if safe, less salt, medicines with meals, and when to call the ASHA or health worker. Mark high-risk homes on your next-visit list before you leave the site.",
    ),
    bullets: AB([
      "Use Gujarati / Hindi handouts when the family prefers them",
      "Ask one family member to repeat the plan back to you",
      "Update the camp pin screened count by saving the batch",
    ]),
  },
  {
    id: "hw-diabetes-basics",
    topics: ["diabetes"],
    kind: "tip",
    title: A("Diabetes basics for field workers counseling families"),
    body: A(
      "Explain Type 2 in simple words: the body cannot use sugar well. Medicines, food, and walking work together. Never scare the family — give one clear next step after every screening.",
    ),
  },
];

export function getEducationTopics(audience: EduAudience): EduTopicMeta[] {
  return audience === "caregiver" ? CAREGIVER_TOPICS : WORKER_TOPICS;
}

export function getEducationLessons(audience: EduAudience): EduLesson[] {
  return audience === "caregiver" ? CAREGIVER_LESSONS : WORKER_LESSONS;
}

export function topicFromConditions(
  conditions: string[],
): Exclude<EduTopicId, "all"> {
  const blob = conditions.join(" ").toLowerCase();
  if (blob.includes("kidney") || blob.includes("nephro")) return "kidneys";
  if (blob.includes("stroke")) return "stroke";
  if (blob.includes("heart") || blob.includes("cardiac")) return "heart";
  if (
    blob.includes("hypertension") ||
    blob.includes("blood pressure") ||
    /\bbp\b/.test(blob)
  )
    return "bp";
  if (blob.includes("diabetes") || blob.includes("sugar")) return "diabetes";
  return "habits";
}
