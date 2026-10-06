import { z } from "zod";

const publicEnvSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.string().url(),
  EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  EXPO_PUBLIC_CRM_API_URL: z.string().url(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

export function getPublicEnv(): PublicEnv {
  const result = publicEnvSchema.safeParse({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_CRM_API_URL: process.env.EXPO_PUBLIC_CRM_API_URL,
  });

  if (!result.success) {
    throw new Error(
      "Missing mobile configuration. Copy .env.example to .env and provide the three public values.",
    );
  }

  return result.data;
}
