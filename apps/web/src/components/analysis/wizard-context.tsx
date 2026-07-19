"use client";

import type { AnalysisResult } from "@coloursense/contracts";
import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";

import type { PreparedImage } from "@/lib/image-validation";

export type WizardStep = "consent" | "guidance" | "capture" | "preview" | "processing" | "results";

export const WIZARD_STEP_ORDER: WizardStep[] = [
  "consent",
  "guidance",
  "capture",
  "preview",
  "processing",
  "results",
];

export interface WizardConsent {
  agreed: boolean;
  saveImage: boolean;
}

interface WizardState {
  step: WizardStep;
  consent: WizardConsent;
  image: PreparedImage | null;
  /** Object URL for the current image; owned by the provider (revoked there). */
  imageUrl: string | null;
  source: "camera" | "upload" | null;
  result: AnalysisResult | null;
}

type WizardAction =
  | { type: "set-consent"; consent: WizardConsent }
  | { type: "go"; step: WizardStep }
  | { type: "set-image"; image: PreparedImage; url: string; source: "camera" | "upload" }
  | { type: "set-result"; result: AnalysisResult }
  | { type: "clear-image" }
  | { type: "reset" };

const initialState: WizardState = {
  step: "consent",
  consent: { agreed: false, saveImage: false },
  image: null,
  imageUrl: null,
  source: null,
  result: null,
};

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "set-consent":
      return { ...state, consent: action.consent };
    case "go":
      return { ...state, step: action.step };
    case "set-image":
      return {
        ...state,
        image: action.image,
        imageUrl: action.url,
        source: action.source,
        result: null,
        step: "preview",
      };
    case "set-result":
      return { ...state, result: action.result };
    case "clear-image":
      return {
        ...state,
        image: null,
        imageUrl: null,
        source: null,
        result: null,
        step: "capture",
      };
    case "reset":
      return initialState;
    default:
      return state;
  }
}

interface WizardContextValue extends WizardState {
  setConsent: (consent: WizardConsent) => void;
  go: (step: WizardStep) => void;
  setImage: (image: PreparedImage, source: "camera" | "upload") => void;
  setResult: (result: AnalysisResult) => void;
  clearImage: () => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const urlRef = useRef<string | null>(null);

  // Revoke any previous object URL whenever it is replaced, and on unmount.
  useEffect(() => {
    const previous = urlRef.current;
    if (previous && previous !== state.imageUrl) {
      URL.revokeObjectURL(previous);
    }
    urlRef.current = state.imageUrl;
  }, [state.imageUrl]);

  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  const value = useMemo<WizardContextValue>(
    () => ({
      ...state,
      setConsent: (consent) => dispatch({ type: "set-consent", consent }),
      go: (step) => dispatch({ type: "go", step }),
      setImage: (image, source) =>
        dispatch({
          type: "set-image",
          image,
          url: URL.createObjectURL(image.blob),
          source,
        }),
      setResult: (result) => dispatch({ type: "set-result", result }),
      clearImage: () => dispatch({ type: "clear-image" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [state],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used inside a WizardProvider");
  }
  return context;
}
