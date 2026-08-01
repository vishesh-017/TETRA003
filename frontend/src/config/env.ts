import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().optional().default(""),
  VITE_SUPABASE_ANON_KEY: z.string().optional().default(""),
  VITE_API_BASE_URL: z.string().default("http://127.0.0.1:8000/api/v1"),
  VITE_APP_NAME: z.string().default("HealNexus"),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  supabaseUrl: parsed.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.VITE_SUPABASE_ANON_KEY,
  apiBaseUrl: parsed.VITE_API_BASE_URL,
  appName: parsed.VITE_APP_NAME,
  isSupabaseConfigured: Boolean(
    parsed.VITE_SUPABASE_URL && parsed.VITE_SUPABASE_ANON_KEY,
  ),
} as const;
