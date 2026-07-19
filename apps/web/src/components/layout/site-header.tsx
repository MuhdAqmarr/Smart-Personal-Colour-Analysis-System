"use client";

import { Menu, Palette } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mainNav, siteConfig } from "@/lib/site";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  // Without Supabase there are no sessions; start resolved instead of
  // setting state synchronously inside the effect.
  const [signedIn, setSignedIn] = useState<boolean | null>(() =>
    isSupabaseConfigured() ? null : false,
  );

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSignedIn(Boolean(data.session));
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLink = (href: string, title: string, mobile = false) => (
    <Link
      key={href}
      href={href}
      onClick={() => setMenuOpen(false)}
      aria-current={pathname === href ? "page" : undefined}
      className={cn(
        "text-muted-foreground hover:text-foreground rounded-md text-sm font-medium transition-colors",
        mobile ? "px-2 py-2 text-base" : "px-3 py-2",
        pathname === href && "text-foreground",
      )}
    >
      {title}
    </Link>
  );

  return (
    <header className="border-border/70 bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label={`${siteConfig.name} home`}>
          <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
            <Palette className="size-4" aria-hidden="true" />
          </span>
          <span className="font-heading text-lg font-semibold tracking-tight">
            {siteConfig.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {mainNav.map((item) => navLink(item.href, item.title))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {signedIn ? (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/dashboard" />}>
                Dashboard
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/sign-in" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/analysis" />}>
                Start analysis
              </Button>
            </>
          )}
        </div>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <Menu className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72">
            <SheetHeader>
              <SheetTitle className="font-heading">{siteConfig.name}</SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4" aria-label="Mobile navigation">
              {mainNav.map((item) => navLink(item.href, item.title, true))}
              <div className="mt-4 flex flex-col gap-2">
                {signedIn ? (
                  <>
                    <Button
                      variant="outline"
                      render={<Link href="/dashboard" onClick={() => setMenuOpen(false)} />}
                    >
                      Dashboard
                    </Button>
                    <Button variant="ghost" onClick={handleSignOut}>
                      Sign out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button render={<Link href="/analysis" onClick={() => setMenuOpen(false)} />}>
                      Start analysis
                    </Button>
                    <Button
                      variant="outline"
                      render={<Link href="/sign-in" onClick={() => setMenuOpen(false)} />}
                    >
                      Sign in
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
