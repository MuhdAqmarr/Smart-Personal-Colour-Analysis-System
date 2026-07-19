"use client";

import { Eye, ImageOff, ScanFace, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { useWizard } from "@/components/analysis/wizard-context";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const consentPoints = [
  {
    icon: ScanFace,
    title: "Why a photo is needed",
    body: "The analysis measures the colour of your skin in small regions of the forehead and cheeks, located with facial landmarks. Without a photo there is nothing to measure.",
  },
  {
    icon: Eye,
    title: "No identity recognition",
    body: "Landmarks are used purely for geometry. The system never identifies you, never compares you with anyone else, and creates no biometric templates.",
  },
  {
    icon: ImageOff,
    title: "Your photo is temporary by default",
    body: "Processing happens in memory and the image is discarded when the analysis finishes. Only derived values — colour numbers, quality scores, and the result — can be saved, and only to your own account.",
  },
  {
    icon: Trash2,
    title: "You stay in control",
    body: "Signed-in users can delete any analysis, any stored image, or the whole account at any time. Guests are never stored at all.",
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
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Before we start: your consent
        </h2>
        <p className="text-muted-foreground mt-2 leading-relaxed">
          Facial images are sensitive personal data. Here is exactly what happens with yours.
        </p>
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {consentPoints.map((point) => (
          <li key={point.title} className="bg-card rounded-xl border p-4">
            <span className="bg-primary/10 text-primary mb-3 flex size-9 items-center justify-center rounded-lg">
              <point.icon className="size-4.5" aria-hidden="true" />
            </span>
            <h3 className="text-sm font-semibold">{point.title}</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{point.body}</p>
          </li>
        ))}
      </ul>

      <div className="space-y-4 rounded-xl border p-4">
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

      <div className="flex justify-end">
        <Button size="lg" onClick={handleContinue}>
          I agree — continue
        </Button>
      </div>
    </div>
  );
}
