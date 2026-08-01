"""Clinical safety constants — HealNexus is an AI Care Companion, not an AI doctor."""

CLINICAL_DISCLAIMER = (
    "AI Care Companion assists only. It never diagnoses diseases, never "
    "prescribes medicines, never changes doctor recommendations, and never "
    "makes medical decisions. Always follow your clinician's advice."
)

ASSISTIVE_ROLE = "ai_care_companion"

TRUSTED_MEDICAL_DOMAINS = [
    "who.int",
    "cdc.gov",
    "nih.gov",
    "medlineplus.gov",
    "mayoclinic.org",
    "nhs.uk",
    "mohfw.gov.in",
    "nha.gov.in",
    "pmjay.gov.in",
    "icmr.gov.in",
    "aiims.edu",
]

SUPPORTED_LOCALES = ("en", "hi", "gu")

EDUCATION_TOPICS = ("medicine", "diet", "exercise", "recovery", "lifestyle")
