import type { Metadata } from "next";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/design-system/page-header";
import { Separator } from "@/components/ui/separator";
import { ProfileSettings } from "@/components/settings/profile-settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Profile, account, and privacy controls." />

      <div className="bg-card ring-border shadow-xs rounded-2xl p-6 ring-1">
        <section aria-labelledby="settings-profile">
          <h2 id="settings-profile" className="text-base font-semibold">
            Profile
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">The display name used to greet you.</p>
          <div className="mt-4 max-w-md">
            <ProfileSettings />
          </div>
        </section>

        <Separator className="my-6" />

        <section aria-labelledby="settings-privacy">
          <h2 id="settings-privacy" className="text-base font-semibold">
            Privacy
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Image-storage preference, history deletion, and account deletion.
          </p>
          <Link
            href="/settings/privacy"
            className="text-foreground hover:bg-surface ring-border duration-(--motion-fast) mt-4 inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium ring-1 transition-colors"
          >
            <Lock className="size-4" aria-hidden="true" />
            Open privacy settings
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
