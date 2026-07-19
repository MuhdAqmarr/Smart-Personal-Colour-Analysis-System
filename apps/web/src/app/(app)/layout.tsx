import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side session gate (the proxy also guards these routes; the
  // backend enforces real authorisation on every API call).
  if (isSupabaseConfigured()) {
    const user = await getServerUser();
    if (!user) {
      redirect("/sign-in?redirect=/dashboard");
    }
  } else {
    redirect("/sign-in?redirect=/dashboard");
  }

  return <AppShell>{children}</AppShell>;
}
