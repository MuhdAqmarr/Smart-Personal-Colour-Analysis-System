import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How facial images and personal data are processed, stored, and deleted.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="19 July 2026"
      intro={`Facial images are sensitive personal data, and ${siteConfig.name} is built around that fact. This policy explains exactly what is processed, what is stored, and the controls you have. It is written to be read, not skimmed.`}
      sections={[
        {
          heading: "What we process and why",
          bullets: [
            "Your facial photo — processed only to locate skin regions on the forehead and cheeks and measure their colour. Processing happens in server memory.",
            "Derived colour values (RGB, HEX, HSV, CIE Lab), quality metrics, undertone and season estimates, and confidence scores — these are the analysis result.",
            "Account data (email, display name) when you register, handled by Supabase Auth.",
            "Optional questionnaire answers (natural hair and eye colour, contrast, jewellery preference) — used only as supporting signals for your result.",
          ],
        },
        {
          heading: "What we do NOT do",
          bullets: [
            "No identity recognition, face matching, or biometric templates — landmarks are used purely for geometry.",
            "No medical, dermatological, or skin-health assessment of any kind.",
            "No storage of guest images or guest results — nothing a guest does is persisted.",
            "No selling or sharing of personal data with third parties.",
            "No facial images in logs, analytics, or error reports — ever.",
          ],
        },
        {
          heading: "Image storage is opt-in only",
          paragraphs: [
            "By default your photo is discarded the moment analysis completes. It is never written to disk on our servers.",
            "If you are signed in, you may tick “Save my analysis image for future comparison” — the checkbox is always off by default. Only then is the image stored, in a private storage bucket under a path only your account can access. Saved images are served exclusively through short-lived signed URLs and can be deleted by you at any time.",
          ],
        },
        {
          heading: "What registered users' accounts store",
          bullets: [
            "Saved analyses: derived colour values, quality metrics, classification results, confidence, and explanations.",
            "Your preferences (for example the default state of the image-storage option) and consent history.",
            "Favourite colours and favourite products.",
          ],
        },
        {
          heading: "Deletion — always available",
          bullets: [
            "Delete any individual analysis (its metrics, samples, classification, and stored image go with it).",
            "Delete any stored image while keeping the analysis result.",
            "Delete your complete analysis history.",
            "Delete your account — this cascades through every record you own, including storage objects.",
          ],
        },
        {
          heading: "Security measures",
          paragraphs: [
            "Row Level Security isolates every user's records at the database layer and is covered by automated verification tests. The backend independently verifies your identity token on every request. Administrators have no interface for browsing users' analyses or source images; administrative statistics are anonymised aggregates.",
          ],
        },
        {
          heading: "Academic context",
          paragraphs: [
            `${siteConfig.name} is a Final Year Project operated for assessment, demonstration, and controlled user testing. Questions or data requests can be raised with the project owner through the repository.`,
          ],
        },
      ]}
    />
  );
}
