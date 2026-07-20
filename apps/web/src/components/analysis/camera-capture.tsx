"use client";

import { Camera, CameraOff, RefreshCcw, ShieldAlert, SwitchCamera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { captureVideoFrame, type PreparedImage } from "@/lib/image-validation";

type CameraState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "streaming" }
  | { status: "denied" }
  | { status: "unavailable" }
  | { status: "insecure" }
  | { status: "error"; message: string };

interface CameraCaptureProps {
  onCapture: (image: PreparedImage) => void;
  /** Called when camera cannot be used, so the parent can suggest upload. */
  onUnavailable?: () => void;
}

/**
 * Still-photo camera capture using MediaDevices.
 * - Permission is requested only after the user presses "Enable camera".
 * - Prefers the front camera; supports switching when multiple cameras exist.
 * - Only a single frame is read on capture; video is never recorded.
 * - All tracks are stopped on capture, unmount, or page hide.
 */
export function CameraCapture({ onCapture, onUnavailable }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>({ status: "idle" });
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startStream = useCallback(
    async (deviceId?: string) => {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setState({ status: "insecure" });
        onUnavailable?.();
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setState({ status: "unavailable" });
        onUnavailable?.();
        return;
      }
      setState({ status: "starting" });
      stopStream();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: deviceId
            ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setState({ status: "streaming" });

        // Labels are only populated after permission is granted.
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        setDevices(allDevices.filter((device) => device.kind === "videoinput"));
      } catch (error) {
        stopStream();
        if (error instanceof DOMException) {
          if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
            setState({ status: "denied" });
            onUnavailable?.();
            return;
          }
          if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
            setState({ status: "unavailable" });
            onUnavailable?.();
            return;
          }
        }
        setState({
          status: "error",
          message: "The camera could not be started. You can upload a photo instead.",
        });
        onUnavailable?.();
      }
    },
    [onUnavailable, stopStream],
  );

  // Stop the camera when leaving the page/tab or unmounting.
  useEffect(() => {
    const handleHide = () => {
      if (document.visibilityState === "hidden") stopStream();
    };
    document.addEventListener("visibilitychange", handleHide);
    return () => {
      document.removeEventListener("visibilitychange", handleHide);
      stopStream();
    };
  }, [stopStream]);

  async function handleCapture() {
    if (!videoRef.current) return;
    setCapturing(true);
    try {
      const image = await captureVideoFrame(videoRef.current);
      stopStream();
      setState({ status: "idle" });
      onCapture(image);
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Capture failed — try again.",
      });
    } finally {
      setCapturing(false);
    }
  }

  async function handleSwitchCamera() {
    if (devices.length < 2) return;
    const nextIndex = (deviceIndex + 1) % devices.length;
    setDeviceIndex(nextIndex);
    await startStream(devices[nextIndex]?.deviceId);
  }

  if (state.status === "insecure") {
    return (
      <Alert>
        <ShieldAlert aria-hidden="true" />
        <AlertTitle>Camera needs a secure connection</AlertTitle>
        <AlertDescription>
          Browsers only allow camera access over HTTPS (or localhost). Open this page over a secure
          connection, or upload a photo instead.
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "denied") {
    return (
      <Alert>
        <CameraOff aria-hidden="true" />
        <AlertTitle>Camera permission was declined</AlertTitle>
        <AlertDescription>
          <p>
            That is completely fine — you can upload a photo instead using the Upload tab. To use
            the camera later, allow camera access for this site in your browser settings and try
            again.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => startStream(devices[deviceIndex]?.deviceId)}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (state.status === "unavailable") {
    return (
      <Alert>
        <CameraOff aria-hidden="true" />
        <AlertTitle>No usable camera found</AlertTitle>
        <AlertDescription>
          Your device did not report a camera the browser can use. Upload a photo instead — the
          analysis works exactly the same.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-surface-strong ring-border relative overflow-hidden rounded-2xl ring-1">
        <video
          ref={videoRef}
          playsInline
          muted
          aria-label="Live camera preview"
          className="aspect-[3/4] w-full object-cover sm:aspect-video"
        />
        {state.status === "streaming" ? (
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <defs>
              <mask id="face-guide-mask">
                <rect width="100" height="100" fill="white" />
                <ellipse cx="50" cy="46" rx="24" ry="32" fill="black" />
              </mask>
            </defs>
            <rect width="100" height="100" fill="rgba(0,0,0,0.35)" mask="url(#face-guide-mask)" />
            <ellipse
              cx="50"
              cy="46"
              rx="24"
              ry="32"
              fill="none"
              stroke="white"
              strokeWidth="0.8"
              strokeDasharray="2.5 2"
            />
          </svg>
        ) : null}
        {state.status === "idle" || state.status === "starting" || state.status === "error" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {state.status === "starting" ? (
              <>
                <Spinner className="size-6" />
                <p className="text-muted-foreground text-sm">Starting camera…</p>
              </>
            ) : (
              <>
                <Camera className="text-muted-foreground size-8" aria-hidden="true" />
                {state.status === "error" ? (
                  <p className="text-destructive max-w-xs text-sm" role="alert">
                    {state.message}
                  </p>
                ) : (
                  <p className="text-muted-foreground max-w-xs text-sm">
                    The camera starts only when you ask it to, and no video is ever recorded — just
                    the single photo you take.
                  </p>
                )}
                <Button onClick={() => startStream()}>
                  <Camera aria-hidden="true" data-icon="inline-start" />
                  Enable camera
                </Button>
              </>
            )}
          </div>
        ) : null}

        {/* Native-style floating capture controls over the viewfinder. */}
        {state.status === "streaming" ? (
          <div className="absolute inset-x-0 bottom-0 flex justify-center p-4">
            <div className="glass-subtle flex items-center gap-6 rounded-full px-6 py-2.5">
              <button
                type="button"
                aria-label="Stop camera"
                onClick={() => {
                  stopStream();
                  setState({ status: "idle" });
                }}
                className="text-foreground/80 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-3 flex size-9 items-center justify-center rounded-full outline-none transition-colors"
              >
                <RefreshCcw className="size-4.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Take photo"
                onClick={handleCapture}
                disabled={capturing}
                className="border-foreground/85 bg-card focus-visible:ring-ring/50 focus-visible:ring-3 flex size-14 items-center justify-center rounded-full border-[3px] outline-none transition-transform disabled:opacity-60 motion-safe:active:scale-95"
              >
                {capturing ? (
                  <Spinner className="size-5" />
                ) : (
                  <span aria-hidden="true" className="bg-foreground size-10 rounded-full" />
                )}
              </button>
              <button
                type="button"
                aria-label="Switch camera"
                onClick={handleSwitchCamera}
                disabled={devices.length < 2}
                className="text-foreground/80 hover:text-foreground focus-visible:ring-ring/50 focus-visible:ring-3 flex size-9 items-center justify-center rounded-full outline-none transition-colors disabled:invisible"
              >
                <SwitchCamera className="size-4.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Position your face inside the oval guide, then take the photo.
      </p>
    </div>
  );
}
