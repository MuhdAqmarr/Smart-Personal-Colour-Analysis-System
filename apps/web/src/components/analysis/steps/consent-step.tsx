"use client";

import { Eye, ImageOff, ScanFace, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useWizard } from "@/components/analysis/wizard-context";
import { WizardNav } from "@/components/analysis/wizard-nav";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const consentPoints = [
  {
    icon: ScanFace,
    title: "Why a photo is needed",
    body: "We measure your skin colour in small spots on your forehead and cheeks. No photo, nothing to measure.",
  },
  {
    icon: Eye,
    title: "No identity recognition",
    body: "Face points are only used for positioning. We never identify you or keep a face template.",
  },
  {
    icon: ImageOff,
    title: "Your photo is temporary by default",
    body: "It is processed in memory and deleted straight after. Only the colour results can be saved.",
  },
  {
    icon: Trash2,
    title: "You stay in control",
    body: "Signed in? Delete any result, saved photo, or your whole account anytime. Guests are never stored.",
  },
];

export function ConsentStep() {
  const { consent, setConsent, go } = useWizard();
  const [agreed, setAgreed] = useState(consent.agreed);
  const [saveImage, setSaveImage] = useState(consent.saveImage);
  const [showError, setShowError] = useState(false);

  function handleContinue() {
    if (!agreed) {
      setShowError(true);
      return;
    }
    setConsent({ agreed, saveImage });
    go("guidance");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[1.4rem] font-semibold tracking-[-0.015em]">
          Before we start: your consent
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Your photo is sensitive, so here is exactly what happens with it — in plain terms.
        </p>
      </div>

      <ul className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
        {consentPoints.map((point) => (
          <li key={point.title} className="flex gap-3">
            <point.icon
              className="text-muted-foreground size-4.5 mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h3 className="text-sm font-semibold">{point.title}</h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{point.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="bg-surface ring-border space-y-4 rounded-xl p-4 ring-1 sm:p-5">
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-agree"
            checked={agreed}
            onCheckedChange={(checked) => {
              setAgreed(checked === true);
              if (checked === true) setShowError(false);
            }}
            aria-describedby={showError ? "consent-error" : undefined}
          />
          <div>
            <Label htmlFor="consent-agree" className="leading-snug">
              I agree to the analysis of my facial image for personal colour recommendations, as
              described above and in the{" "}
              <Link href="/privacy" className="text-primary underline underline-offset-4">
                privacy policy
              </Link>
              .
            </Label>
            {showError ? (
              <p
                id="consent-error"
                role="alert"
                className="text-destructive mt-1 text-xs font-medium"
              >
                Consent is required before an analysis can run.
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="consent-save-image"
            checked={saveImage}
            onCheckedChange={(checked) => setSaveImage(checked === true)}
          />
          <div>
            <Label htmlFor="consent-save-image" className="leading-snug">
              Save my analysis image for future comparison{" "}
              <span className="text-muted-foreground">(optional, off by default)</span>
            </Label>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Applies only when you are signed in. The image goes to a private storage area only you
              can access, and you can delete it whenever you like.
            </p>
          </div>
        </div>
      </div>

      <WizardNav onContinue={handleContinue} continueLabel="Continue" />
    </div>
  );
}
