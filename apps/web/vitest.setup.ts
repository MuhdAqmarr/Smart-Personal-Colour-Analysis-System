import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// RTL auto-cleanup does not register without vitest globals; do it explicitly.
afterEach(() => {
  cleanup();
});

// jsdom does not define isSecureContext; camera code checks it explicitly.
if (typeof window !== "undefined" && window.isSecureContext === undefined) {
  Object.defineProperty(window, "isSecureContext", { value: true, configurable: true });
}

// jsdom lacks matchMedia; several UI primitives (sonner, Base UI) query it.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

if (typeof window !== "undefined" && !("ResizeObserver" in window)) {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}
