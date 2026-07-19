import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth callback for email confirmation, magic links, and password recovery.
 * Exchanges the auth code for a session, then forwards to `next`
 * (same-origin paths only).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const nextParam = url.searchParams.get("next") ?? "/dashboard";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(new URL(next, url.origin));
      }
    }
  }

  const failure = new URL("/sign-in", url.origin);
  failure.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(failure);
}
