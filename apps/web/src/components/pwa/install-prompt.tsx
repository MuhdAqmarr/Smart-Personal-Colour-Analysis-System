"use client";

import { Plus, Share, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "matchlab:install-dismissed";
const DISMISS_MS = 3 * 24 * 60 * 60 * 1000; // re-offer after 3 days

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<null | "android" | "ios">(null);

  useEffect(() => {
    if (isStandalone()) return;
    try {
      const ts = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
      if (ts && Date.now() - ts < DISMISS_MS) return;
    } catch {
      // localStorage unavailable (private mode) — carry on
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setMode("android");
    };
    const onInstalled = () => {
      setDeferred(null);
      setMode(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari has no beforeinstallprompt — show a manual hint instead.
    const ua = window.navigator.userAgent;
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS && isSafari) {
      timer = setTimeout(() => setMode((current) => current ?? "ios"), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!mode) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore
    }
    setMode(null);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      // user dismissed the native dialog
    }
    setDeferred(null);
    setMode(null);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div
        role="dialog"
        aria-label={`Install ${siteConfig.name}`}
        className="border-border bg-card/95 supports-[backdrop-filter]:bg-card/80 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border p-3 shadow-lg backdrop-blur duration-500"
      >
        <Image
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="border-border size-11 shrink-0 rounded-xl border"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add {siteConfig.name} to your home screen</p>
          {mode === "android" ? (
            <p className="text-muted-foreground text-xs">
              Install it for one-tap access, like an app.
            </p>
          ) : (
            <p className="text-muted-foreground flex flex-wrap items-center gap-1 text-xs">
              Tap
              <Share className="inline size-3.5" aria-hidden="true" />
              then <span className="text-foreground font-medium">Add to Home Screen</span>
              <Plus className="inline size-3.5" aria-hidden="true" />
            </p>
          )}
        </div>
        {mode === "android" && (
          <Button size="sm" onClick={install}>
            Install
          </Button>
        )}
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring -mr-1 shrink-0 rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
