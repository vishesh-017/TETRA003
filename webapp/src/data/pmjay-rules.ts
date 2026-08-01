/** Rule-based PM-JAY guidance — not a live government API. */
export const PMJAY_RULES = {
  liveApi: false as const,
  eligibilityQuestions: [
    {
      id: "eq1",
      question:
        "Is the household listed under SECC / eligible beneficiary lists?",
    },
    {
      id: "eq2",
      question: "Does the patient have a valid Ayushman card / eligible ID?",
    },
  ],
  benefits: [
    {
      title: "Cashless treatment coverage (demo summary)",
      body: "Illustrative benefit summary for architecture demos.",
    },
  ],
  requiredDocuments: [
    { name: "Aadhaar / identity proof", required: true },
    { name: "Ration card / income proof (as applicable)", required: false },
    { name: "Ayushman card (if issued)", required: false },
  ],
} as const;
