import type { Metadata } from "next";
import { ArrowRight, Heart, History, Lock, ScanFace, Settings } from "lucide-react";
import Link from "next/link";

import { LatestAnalysisCard } from "@/components/dashboard/latest-analysis-card";
import { PageHeader } from "@/components/design-system/page-header";
import { Button } from "@/components/ui/button";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

const quickLinks = [
  {
    href: "/history",
    icon: History,
    title: "Saved analyses",
    body: "Review and compare previous results.",
  },
  {
    href: "/favourites",
    icon: Heart,
    title: "Favourites",
    body: "Colours and products you have saved.",
  },
  {
    href: "/settings",
    icon: Settings,
    title: "Settings & privacy",
    body: "Storage preferences and account controls.",
  },
];

export default async function DashboardPage() {
  const user = await getServerUser();
  const greeting =
    (user?.user_metadata?.display_name as string | undefined) ?? user?.email ?? "there";

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hello, ${greeting}`}
        description="Run a new analysis or pick up where you left off."
        actions={
          <Button render={<Link href="/analysis" />}>
            <ScanFace aria-hidden="true" data-icon="inline-start" />
            New analysis
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <LatestAnalysisCard />

        <nav aria-label="Quick links" className="bg-card ring-border shadow-xs rounded-xl ring-1">
          <ul className="divide-separator divide-y">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:bg-surface duration-(--motion-fast) group flex items-center gap-3.5 p-4 transition-colors first:rounded-t-xl last:rounded-b-xl"
                >
                  <span className="bg-secondary text-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                    <link.icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{link.title}</span>
                    <span className="text-muted-foreground block text-xs">{link.body}</span>
                  </span>
                  <ArrowRight
                    className="text-muted-foreground group-hover:text-foreground duration-(--motion-fast) size-4 shrink-0 transition-colors"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Analyses store only derived colour values — never your photo, unless you explicitly opted
          to save it. Everything can be deleted from{" "}
          <Link href="/settings/privacy" className="text-foreground underline underline-offset-4">
            privacy settings
          </Link>
          .
        </span>
      </p>
    </div>
  );
}
