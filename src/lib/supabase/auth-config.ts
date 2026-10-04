export type SupabaseAuthPublicConfig = {
  url: string;
  publishableKey: string;
};

export function getSupabaseAuthPublicConfig(): SupabaseAuthPublicConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) return null;

  const configuredServerUrl = process.env.SUPABASE_URL?.trim();
  if (configuredServerUrl && configuredServerUrl !== url) return null;

  const expectedTarget = process.env.VERCEL_ENV === "production" ? "production" : "test";
  if (process.env.SUPABASE_DATA_TARGET !== expectedTarget) return null;

  return { url, publishableKey };
}
