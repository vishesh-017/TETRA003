import en from "@/modules/rural/data/education-en.json";
import hi from "@/modules/rural/data/education-hi.json";
import type { EducationCard, RuralLocale } from "@/modules/rural/types";

/** Gujarati pack — field-simple phrasing for ASHA/family education. */
const gu: EducationCard[] = [
  {
    id: "medicine",
    topic: "medicine",
    title: "Dava kevi rite levavi",
    body: "Darroj ekaj samaye dava apo. Dose na chhodo.",
    bullets: [
      "Doctor kahe to khadha pachhi lo",
      "Dava thandi suki jagyae rakho",
      "Chhuteli dose par bamni na apo",
    ],
  },
  {
    id: "diet",
    topic: "diet",
    title: "Saral aahar suchano",
    body: "Ghar nu khavanu lo. Khand, mithu ane taleelu ochhu karo.",
    bullets: [
      "Divasbhar swachh pani pio",
      "Shakbhaji, daal, anaj pasand karo",
      "Mithai ane pack drink ochha rakho",
    ],
  },
  {
    id: "exercise",
    topic: "exercise",
    title: "Halvi kasarat",
    body: "Roj thodi chalvu saru. Chhati no dukhavo thaye to atko.",
    bullets: [
      "Doctor kahe to 20-30 minute chalo",
      "Bhare vastu na unchko",
      "Shwas fule to besi jao",
    ],
  },
  {
    id: "warning",
    topic: "warning_signs",
    title: "Chetavni na sanket",
    body: "Samasyā vadhe to jaldi aarogya karyakar ke doctor ne kaho.",
    bullets: [
      "Sugar ke BP khub unchu rahevu",
      "Tav na utarvo",
      "Gha par sojo ke paru",
    ],
  },
  {
    id: "followup",
    topic: "follow_up",
    title: "Follow-up sha mate jaruri",
    body: "Follow-up thi samasya vaheli pakday chhe.",
    bullets: [
      "Dava ni yadi ane reading lavo",
      "Salah vagar dava na bandh karo",
      "Nava lakshano kaho",
    ],
  },
  {
    id: "emergency",
    topic: "emergency",
    title: "Katokati na lakshano",
    body: "Aa sanket par hospital jao athva 108 call karo.",
    bullets: [
      "Chhati no dukhavo ke tivra shwas fulvo",
      "Bebhan thavu, gunchvan, anchki",
      "Khub tivra tav ke raktastrav",
    ],
  },
];

export function getEducationCards(locale: RuralLocale): EducationCard[] {
  if (locale === "hi") return hi as EducationCard[];
  if (locale === "gu") return gu;
  return en as EducationCard[];
}
