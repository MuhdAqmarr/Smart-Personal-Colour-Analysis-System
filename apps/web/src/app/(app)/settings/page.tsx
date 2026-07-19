import type { Metadata } from "next";
import { Lock, UserRound } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileSettings } from "@/components/settings/profile-settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Profile, account, and privacy controls.</p>
      </div>

      <Card>
        <CardHeader>
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <UserRound className="size-4.5" aria-hidden="true" />
          </span>
          <CardTitle className="font-heading text-lg">Profile</CardTitle>
          <CardDescription>The display name used to greet you.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
            <Lock className="size-4.5" aria-hidden="true" />
          </span>
          <CardTitle className="font-heading text-lg">Privacy</CardTitle>
          <CardDescription>
            Image-storage preference, history deletion, and account deletion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" render={<Link href="/settings/privacy" />}>
            Open privacy settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
