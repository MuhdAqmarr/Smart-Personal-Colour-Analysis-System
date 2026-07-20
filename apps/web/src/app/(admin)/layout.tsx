import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getServerUser } from "@/lib/supabase/server";

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  // Server-side session gate (the proxy also guards these routes; the
  // backend re-checks the admin role on every /api/v1/admin call).
  if (isSupabaseConfigured()) {
    const user = await getServerUser();
    if (!user) {
      redirect("/sign-in?redirect=/admin");
    }
  } else {
    redirect("/sign-in?redirect=/admin");
  }

  return <AdminShell>{children}</AdminShell>;
}
