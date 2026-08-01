/** Shared username helpers for patients, doctors, and other roles. */

export function normalizeUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, ".")
    .replace(/\.{2,}/g, ".")
    .replace(/^[._-]+|[._-]+$/g, "")
    .slice(0, 32);
}

/** Suggest a unique-looking username from a display name. */
export function suggestUsername(fullName: string, roleHint?: string): string {
  const base =
    normalizeUsername(fullName.replace(/\bdr\.?\s*/i, "")) ||
    normalizeUsername(roleHint || "user") ||
    "user";
  return base.length >= 3 ? base : `${base}${Math.floor(Math.random() * 90 + 10)}`;
}

export function isValidUsername(raw: string): boolean {
  const u = normalizeUsername(raw);
  return u.length >= 3 && /^[a-z0-9][a-z0-9._-]{1,30}[a-z0-9]$/.test(u);
}
