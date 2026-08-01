export const USER_ROLES = [
  "doctor",
  "patient",
  "caregiver",
  "health_worker",
  "admin",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface User {
  id: string;
  email: string | null;
  full_name: string;
  phone: string | null;
  role: UserRole;
  locale: string;
  avatar_url: string | null;
  is_active: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface MeResponse {
  user: User;
  doctor?: Record<string, unknown> | null;
  patient?: Record<string, unknown> | null;
  caregiver?: Record<string, unknown> | null;
  health_worker?: Record<string, unknown> | null;
}

export interface ApiErrorBody {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  roles?: UserRole[];
}
