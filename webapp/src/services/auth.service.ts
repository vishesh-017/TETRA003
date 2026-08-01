import { getStore, IDS } from "@/data/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { MeResponse, User, UserRole } from "@/types";

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

function profileToUser(id: string): User | null {
  const profile = getStore().profiles.find((p) => p.id === id);
  if (!profile) return null;
  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    phone: profile.phone,
    role: profile.role,
    locale: profile.locale,
    avatar_url: null,
    is_active: true,
  };
}

/** Frontend-first: resolve user from local dynamic store or Supabase profile. */
export async function fetchCurrentUser(token: string): Promise<MeResponse> {
  if (token.startsWith("demo-token-")) {
    const role = token.replace("demo-token-", "") as UserRole;
    const id =
      role === "doctor"
        ? IDS.doctorUser
        : role === "patient"
          ? IDS.patientUser
          : role === "caregiver"
            ? "00000000-0000-4000-8000-000000000003"
            : "00000000-0000-4000-8000-000000000004";
    const user = profileToUser(id);
    if (user) return { user };
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .maybeSingle();
      return {
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
          full_name:
            profile?.full_name ||
            (data.user.user_metadata?.full_name as string | undefined) ||
            data.user.email ||
            "HealNexus User",
          phone: profile?.phone ?? null,
          role:
            (profile?.role as UserRole | undefined) ||
            ((data.user.app_metadata?.role ||
              data.user.user_metadata?.role) as UserRole | undefined) ||
            "patient",
          locale: profile?.locale || "en",
          avatar_url: null,
          is_active: true,
        },
      };
    }
  }

  const local = profileToUser(IDS.patientUser);
  if (local) return { user: local };
  throw new Error("Unable to resolve current user");
}

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin";
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
