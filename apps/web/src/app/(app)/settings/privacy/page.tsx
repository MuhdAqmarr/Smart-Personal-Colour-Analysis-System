import type { Metadata } from "next";

import { PrivacySettings } from "@/components/settings/privacy-settings";

export const metadata: Metadata = { title: "Privacy settings" };

export default function PrivacySettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-muted-foreground mt-1">
          Your data, your call — storage preferences and deletion, all in one place.
        </p>
      </div>
      <PrivacySettings />
    </div>
  );
}
