import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { env } from "@/config/env";
import { getSupabaseClient } from "@/lib/supabase";
import {
  fetchCurrentUser,
  loginWithPassword,
  logout as logoutService,
  type LoginCredentials,
} from "@/services/auth.service";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginDemo: (role: UserRole) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const DEMO_USERS: Record<UserRole, User> = {
  doctor: {
    id: "00000000-0000-4000-8000-000000000001",
    email: "doctor@healnexus.demo",
    full_name: "Dr. Demo Clinician",
    phone: null,
    role: "doctor",
    locale: "en",
    avatar_url: null,
    is_active: true,
  },
  patient: {
    id: "00000000-0000-4000-8000-000000000101",
    email: "asha@healnexus.demo",
    full_name: "Asha Patel",
    phone: "+91-9876511111",
    role: "patient",
    locale: "en",
    avatar_url: null,
    is_active: true,
  },
  caregiver: {
    id: "00000000-0000-4000-8000-000000000003",
    email: "caregiver@healnexus.demo",
    full_name: "Demo Caregiver",
    phone: null,
    role: "caregiver",
    locale: "en",
    avatar_url: null,
    is_active: true,
  },
  health_worker: {
    id: "00000000-0000-4000-8000-000000000004",
    email: "asha@healnexus.demo",
    full_name: "Demo Health Worker",
    phone: null,
    role: "health_worker",
    locale: "en",
    avatar_url: null,
    is_active: true,
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!accessToken || isDemoMode) return;
    const me = await fetchCurrentUser(accessToken);
    setUser(me.user);
  }, [accessToken, isDemoMode]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const session = data.session;
      if (!session) {
        setIsLoading(false);
        return;
      }

      setAccessToken(session.access_token);
      try {
        const me = await fetchCurrentUser(session.access_token);
        if (mounted) setUser(me.user);
      } catch {
        if (mounted) {
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            full_name:
              (session.user.user_metadata?.full_name as string | undefined) ||
              session.user.email ||
              "HealNexus User",
            phone: null,
            role:
              ((session.user.app_metadata?.role ||
                session.user.user_metadata?.role) as UserRole | undefined) ||
              "patient",
            locale: "en",
            avatar_url: null,
            is_active: true,
          });
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token ?? null);
      if (!session) {
        setUser(null);
        setIsDemoMode(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const data = await loginWithPassword(credentials);
      const token = data.session?.access_token;
      if (!token) {
        throw new Error("No session returned from Supabase");
      }
      setAccessToken(token);
      setIsDemoMode(false);
      try {
        const me = await fetchCurrentUser(token);
        setUser(me.user);
      } catch {
        setUser({
          id: data.user?.id ?? "unknown",
          email: credentials.email,
          full_name: credentials.email,
          phone: null,
          role: "patient",
          locale: "en",
          avatar_url: null,
          is_active: true,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginDemo = useCallback((role: UserRole) => {
    setIsDemoMode(true);
    setAccessToken(`demo-token-${role}`);
    setUser(DEMO_USERS[role]);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    if (!isDemoMode && env.isSupabaseConfigured) {
      await logoutService();
    }
    setUser(null);
    setAccessToken(null);
    setIsDemoMode(false);
  }, [isDemoMode]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isLoading,
      isAuthenticated: Boolean(user),
      isDemoMode,
      login,
      loginDemo,
      logout,
      refreshUser,
    }),
    [
      user,
      accessToken,
      isLoading,
      isDemoMode,
      login,
      loginDemo,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
