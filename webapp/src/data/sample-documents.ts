/** Sample clinical documents for demo upload flows (OCR not required). */
export const SAMPLE_DOCUMENTS = {
  sample_prescription: {
    key: "sample_prescription",
    title: "Sample Prescription",
    kind: "prescription" as const,
  },
  sample_lab_report: {
    key: "sample_lab_report",
    title: "Sample Lab Report",
    kind: "lab_report" as const,
  },
} as const;
