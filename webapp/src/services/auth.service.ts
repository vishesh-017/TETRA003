import { getStore, IDS } from "@/data/store";
import { getSupabaseClient } from "@/lib/supabase";
import type { MeResponse, User, UserRole } from "@/types";

export interface LoginCredentials {
  /** User ID (username) or email */
  email: string;
  password: string;
}

/** Local store login for admin-created and demo accounts. */
export function loginWithLocalCredentials({
  email,
  password,
}: LoginCredentials): User {
  const idOrEmail = email.trim().toLowerCase();
  if (!idOrEmail || !password) {
    throw new Error("Enter User ID and password");
  }
  const profile = getStore().profiles.find(
    (p) =>
      p.username?.toLowerCase() === idOrEmail ||
      p.email?.toLowerCase() === idOrEmail,
  );
  if (!profile) {
    throw new Error("Unknown User ID or email");
  }
  if (!profile.password || profile.password !== password) {
    throw new Error("Incorrect password");
  }
  const patient = getStore().patients.find((p) => p.user_id === profile.id);
  if (patient?.is_archived) {
    throw new Error("This account is archived");
  }
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

export async function loginWithPassword({ email, password }: LoginCredentials) {
  // Prefer local DB when credentials match (admin-created users, demo seed).
  try {
    const localUser = loginWithLocalCredentials({ email, password });
    return {
      session: { access_token: `local-token-${localUser.id}` },
      user: {
        id: localUser.id,
        email: localUser.email,
        user_metadata: { full_name: localUser.full_name, role: localUser.role },
        app_metadata: { role: localUser.role },
      },
      localUser,
    };
  } catch (localError) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      throw localError instanceof Error
        ? localError
        : new Error("Unable to sign in");
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }
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
  if (token.startsWith("local-token-")) {
    const id = token.replace("local-token-", "");
    const user = profileToUser(id);
    if (user) return { user };
  }

  if (token.startsWith("demo-token-")) {
    const role = token.replace("demo-token-", "") as UserRole;
    const id =
      role === "doctor"
        ? IDS.doctorUser
        : role === "patient"
          ? IDS.patientUser
          : role === "caregiver"
            ? "00000000-0000-4000-8000-000000000003"
            : role === "admin"
              ? IDS.adminUser
              : IDS.healthWorkerUser;
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
