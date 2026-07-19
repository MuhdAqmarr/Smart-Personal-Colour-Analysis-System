import type { Metadata } from "next";
import { History, Lock, ScanFace, Settings } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await getServerUser();
  const greeting =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? "there";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">Hello, {greeting}</h1>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Run a new analysis or pick up where you left off.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader>
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <ScanFace className="size-5" aria-hidden="true" />
            </span>
            <CardTitle className="font-heading">New analysis</CardTitle>
            <CardDescription>
              Capture or upload a photo and get your colour profile in about a minute.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button render={<Link href="/analysis" />}>Start now</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <History className="size-5" aria-hidden="true" />
            </span>
            <CardTitle className="font-heading">Saved analyses</CardTitle>
            <CardDescription>
              Review previous results, compare them, or delete the ones you no longer want.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/history" />}>
              Open history
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
              <Settings className="size-5" aria-hidden="true" />
            </span>
            <CardTitle className="font-heading">Settings &amp; privacy</CardTitle>
            <CardDescription>
              Storage preferences, history deletion, and account controls.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" render={<Link href="/settings" />}>
              Open settings
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-dashed">
        <CardHeader className="flex-row items-start gap-3 space-y-0">
          <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Lock className="size-4" aria-hidden="true" />
          </span>
          <div>
            <CardTitle className="font-heading text-base">Your data, your call</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">
              Analyses store only derived colour values — never your photo, unless you explicitly
              opted to save it. Everything can be deleted from{" "}
              <Link href="/settings/privacy" className="text-primary underline underline-offset-4">
                privacy settings
              </Link>
              .
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
