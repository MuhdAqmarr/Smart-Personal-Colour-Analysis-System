"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

interface SessionState {
  session: Session | null;
  loading: boolean;
  configured: boolean;
}

/** Client-side Supabase session with live updates. */
export function useSession(): SessionState {
  const configured = isSupabaseConfigured();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(configured);

  useEffect(() => {
    if (!configured) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [configured]);

  return { session, loading, configured };
}
