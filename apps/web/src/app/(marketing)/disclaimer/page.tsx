import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Analysis disclaimer",
  description: "Honest limitations of the colour analysis and factors that affect results.",
};

export default function DisclaimerPage() {
  return (
    <LegalPage
      title="Analysis Disclaimer"
      updated="19 July 2026"
      intro="The colour analysis is an estimate. This page explains, plainly, what can influence your result and how to interpret it."
      sections={[
        {
          heading: "How to read your result",
          paragraphs: [
            "Every analysis returns an estimated undertone, a suggested colour season, and a confidence score. “Estimated” and “suggested” are chosen deliberately: the engine applies documented colour-science rules to measurements from your photo, and photos are imperfect. A high-confidence result is a strong starting point; a low-confidence result is an invitation to retake the photo in better conditions.",
          ],
        },
        {
          heading: "Factors that affect accuracy",
          bullets: [
            "Camera sensor quality and image compression.",
            "Beauty filters and post-processing.",
            "Makeup — especially foundation, blusher, and bronzer.",
            "White balance and artificial, yellow, or coloured lighting.",
            "Shadows, overexposure, and underexposure.",
            "Hair covering the forehead or cheeks.",
            "Eyeglasses and coloured contact lenses.",
            "Facial pose and distance from the camera.",
            "Background colours reflecting onto the skin.",
            "Inaccurate answers in the optional questionnaire.",
          ],
        },
        {
          heading: "The engine, honestly described",
          paragraphs: [
            "The classifier is rule-based and deterministic: colour measurements in the CIE Lab colour space, configurable thresholds, and documented scoring — version-stamped on every result. It is not a trained machine-learning model, and we make no statistical accuracy claims because no professionally-labelled evaluation dataset was available. Evaluation focused on technical consistency (the same photo always yields the same result) and behaviour across diverse skin tones.",
          ],
        },
        {
          heading: "Not medical, not biometric",
          paragraphs: [
            "The system performs no medical or dermatological assessment and no identity recognition. If you have concerns about your skin, consult a qualified professional.",
          ],
        },
        {
          heading: "Professional consultations",
          paragraphs: [
            "An in-person colour consultant controls lighting, uses physical drapes, and evaluates dynamically — things a single photo cannot replicate. Treat this tool as an accessible, educational starting point, not a certified verdict.",
          ],
        },
      ]}
    />
  );
}
