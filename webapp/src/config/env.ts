import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().optional().default(""),
  VITE_SUPABASE_ANON_KEY: z.string().optional().default(""),
  VITE_EXA_API_KEY: z.string().optional().default(""),
  VITE_AI_API_BASE_URL: z.string().optional().default(""),
  VITE_APP_NAME: z.string().default("HealNexus"),
});

const parsed = envSchema.parse(import.meta.env);

export const env = {
  supabaseUrl: parsed.VITE_SUPABASE_URL,
  supabaseAnonKey: parsed.VITE_SUPABASE_ANON_KEY,
  exaApiKey: parsed.VITE_EXA_API_KEY,
  aiApiBaseUrl: parsed.VITE_AI_API_BASE_URL,
  appName: parsed.VITE_APP_NAME,
  isSupabaseConfigured: Boolean(
    parsed.VITE_SUPABASE_URL && parsed.VITE_SUPABASE_ANON_KEY,
  ),
} as const;
