import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Gracefully prevent crashes on missing or placeholder Supabase keys
  if (!url || !anonKey || url.includes("[YOUR-") || url.includes("dummy-") || url === "https://dummy-project.supabase.co") {
    console.warn("⚠️ Supabase Browser Client: Skip initialization due to missing or placeholder credentials.");
    return null as any;
  }

  return createBrowserClient(url, anonKey);
}
