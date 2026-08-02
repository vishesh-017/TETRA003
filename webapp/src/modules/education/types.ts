export type EduLocale = "en" | "hi" | "gu";

export type EduTopicId =
  | "all"
  | "diabetes"
  | "bp"
  | "kidneys"
  | "heart"
  | "stroke"
  | "habits"
  | "diet"
  | "medicine"
  | "emergency"
  | "screening"
  | "adherence"
  | "family";

export type EduLessonKind = "video" | "diet" | "tip";

export type EduLesson = {
  id: string;
  topics: Exclude<EduTopicId, "all">[];
  kind: EduLessonKind;
  title: Record<EduLocale, string>;
  body: Record<EduLocale, string>;
  bullets?: Record<EduLocale, string[]>;
};

export type EduAudience = "caregiver" | "health_worker";

export type EduTopicMeta = {
  id: EduTopicId;
  label: Record<EduLocale, string>;
  accent?: string;
};
