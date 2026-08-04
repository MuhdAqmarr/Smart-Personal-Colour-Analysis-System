import type { Metadata } from "next";

import { AnalysisWizard } from "@/components/analysis/analysis-wizard";
import { MemberBottomNav, MemberSidebar } from "@/components/layout/member-nav";
import { getServerUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Colour analysis",
  description:
    "Capture or upload a facial photo and receive an estimated undertone, colour season, and personal palettes.",
};

export default async function AnalysisPage() {
  // /analysis is public so guests can run an analysis. Signed-in members get
  // the same account navigation as the rest of the app for consistency;
  // guests keep the clean, distraction-free flow.
  const user = await getServerUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="sr-only">Personal colour analysis</h1>
        <AnalysisWizard />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto flex w-full max-w-6xl gap-10 px-4 py-8 sm:px-6">
        <MemberSidebar />
        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          <h1 className="sr-only">Personal colour analysis</h1>
          <div className="mx-auto max-w-3xl">
            <AnalysisWizard />
          </div>
        </main>
      </div>
      <MemberBottomNav />
    </>
  );
}
