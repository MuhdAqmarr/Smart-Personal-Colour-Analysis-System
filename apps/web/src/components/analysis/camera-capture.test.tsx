import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CameraCapture } from "./camera-capture";

describe("CameraCapture", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not request the camera until the user asks", () => {
    const getUserMedia = vi.fn();
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: { getUserMedia, enumerateDevices: vi.fn().mockResolvedValue([]) },
    });
    render(<CameraCapture onCapture={vi.fn()} />);
    expect(screen.getByRole("button", { name: /enable camera/i })).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it("falls back gracefully when permission is denied", async () => {
    const onUnavailable = vi.fn();
    const denied = new DOMException("Permission denied", "NotAllowedError");
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(denied),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const user = userEvent.setup();
    render(<CameraCapture onCapture={vi.fn()} onUnavailable={onUnavailable} />);
    await user.click(screen.getByRole("button", { name: /enable camera/i }));

    expect(await screen.findByText(/camera permission was declined/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a photo instead/i)).toBeInTheDocument();
    expect(onUnavailable).toHaveBeenCalled();
  });

  it("explains when no camera hardware is available", async () => {
    const missing = new DOMException("No camera", "NotFoundError");
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn().mockRejectedValue(missing),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });

    const user = userEvent.setup();
    render(<CameraCapture onCapture={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /enable camera/i }));

    expect(await screen.findByText(/no usable camera found/i)).toBeInTheDocument();
  });

  it("explains the HTTPS requirement in insecure contexts", async () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      mediaDevices: {
        getUserMedia: vi.fn(),
        enumerateDevices: vi.fn().mockResolvedValue([]),
      },
    });
    const original = window.isSecureContext;
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });

    const user = userEvent.setup();
    render(<CameraCapture onCapture={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /enable camera/i }));

    expect(await screen.findByText("Camera needs a secure connection")).toBeInTheDocument();
    expect(screen.getByText(/HTTPS/)).toBeInTheDocument();
    Object.defineProperty(window, "isSecureContext", { value: original, configurable: true });
  });
});
