import { apiRequest } from "@/api/client";
import { getSupabaseClient } from "@/lib/supabase";
import type { MeResponse, UserRole } from "@/types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function loginWithPassword({ email, password }: LoginCredentials) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function logout() {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getAccessToken(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

export async function fetchCurrentUser(token: string): Promise<MeResponse> {
  return apiRequest<MeResponse>("/auth/me", { token });
}

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "doctor":
      return "/doctor";
    case "patient":
      return "/patient";
    case "caregiver":
      return "/caregiver";
    case "health_worker":
      return "/rural";
    default:
      return "/";
  }
}
