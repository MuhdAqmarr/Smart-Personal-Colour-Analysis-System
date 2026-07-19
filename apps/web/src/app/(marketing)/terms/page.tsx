import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms governing use of this Final Year Project application.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="19 July 2026"
      intro={`These terms govern your use of ${siteConfig.name}, a Final Year Project web application. By using the application you agree to them.`}
      sections={[
        {
          heading: "Nature of the service",
          paragraphs: [
            `${siteConfig.name} is a personal styling and educational recommendation tool. Results are estimates produced by a rule-based colour-analysis engine and may vary with lighting, camera, and image conditions. The service is provided for academic demonstration and personal, non-commercial use.`,
          ],
        },
        {
          heading: "What the service is not",
          bullets: [
            "Not a medical application, dermatology diagnosis system, or skin-health assessment tool.",
            "Not a facial identification or biometric identity system.",
            "Not a guaranteed replacement for a professional colour consultant.",
            "Not a marketplace — product links lead to external stores, and any purchase is made with that store under its own terms.",
          ],
        },
        {
          heading: "Your responsibilities",
          bullets: [
            "Only submit photos of yourself, or photos you have clear permission to analyse.",
            "Do not attempt to disrupt, overload, reverse-engineer authentication, or access other users' data.",
            "Keep your account credentials secure; actions under your account are your responsibility.",
          ],
        },
        {
          heading: "Content and availability",
          paragraphs: [
            "Palette, cosmetic, and product data are curated demonstration content and may change or be reset during the project. The service may be unavailable during maintenance, evaluation, or after the assessment period.",
          ],
        },
        {
          heading: "Liability",
          paragraphs: [
            "The application is provided “as is” for academic purposes, without warranties of any kind. To the maximum extent permitted by law, the project owner is not liable for decisions made on the basis of styling recommendations, external store purchases, or service interruptions.",
          ],
        },
        {
          heading: "Changes",
          paragraphs: [
            "These terms may be updated as the project evolves; the date above reflects the latest revision. Continued use after an update constitutes acceptance.",
          ],
        },
      ]}
    />
  );
}
