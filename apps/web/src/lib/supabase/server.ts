import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

/**
 * Server-side Supabase client for Server Components and Route Handlers.
 * Returns null when Supabase is not configured.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies; the proxy refresh
          // handles session renewal in that case.
        }
      },
    },
  });
}

/** Authenticated user for the current request, verified against Supabase. */
export async function getServerUser(): Promise<User | null> {
  const client = await getSupabaseServerClient();
  if (!client) return null;
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}
