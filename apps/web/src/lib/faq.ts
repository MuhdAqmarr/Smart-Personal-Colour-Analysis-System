export interface Faq {
  question: string;
  answer: string;
}

export const landingFaqs: Faq[] = [
  {
    question: "Is this artificial intelligence?",
    answer:
      "No — and we think that's a feature. The engine is rule-based: it uses documented colour science (CIE Lab, hue angles, CIEDE2000) with published thresholds, so every result can be explained. Nothing about it is a black box, and we never invent accuracy numbers.",
  },
  {
    question: "Is my photo stored anywhere?",
    answer:
      "By default, no. Your image is processed in memory and discarded when the analysis finishes. Only if you are signed in and explicitly tick 'save my analysis image' is it kept — in a private storage bucket only you can access, deletable at any time.",
  },
  {
    question: "How accurate is the result?",
    answer:
      "Results are estimates and depend heavily on lighting, camera quality, filters, and makeup. Every analysis includes a confidence score, and low-confidence results say so honestly with tips for a better photo. It is a styling aid, not a certified consultation.",
  },
  {
    question: "Can I use it without an account?",
    answer:
      "Yes. Guests can run a full analysis and see every recommendation. An account is only needed to save analyses, favourites, and stored images. Guest data is never persisted.",
  },
];

export const fullFaqs: Faq[] = [
  ...landingFaqs,
  {
    question: "What affects the quality of my result?",
    answer:
      "Camera sensor and compression, beauty filters, makeup, white balance, yellow or coloured lighting, shadows, over- or under-exposure, hair covering the face, glasses, coloured contact lenses, facial pose, and background reflections. The quality check warns you about most of these before analysing.",
  },
  {
    question: "Why do I need to remove glasses and heavy makeup?",
    answer:
      "The engine samples skin colour from your forehead and cheeks. Tinted lenses, frames, foundation, and blusher change the measured colour, which can shift the undertone estimate. Natural skin in daylight gives the most reliable reading.",
  },
  {
    question: "What are the four seasons and twelve sub-seasons?",
    answer:
      "Spring (warm, light, clear), Summer (cool, light, muted), Autumn (warm, deep, muted), and Winter (cool, deep, clear). Each divides into three sub-seasons — for example Deep Autumn or Bright Winter — shown only when the analysis is confident enough to be useful.",
  },
  {
    question: "Does it diagnose anything about my skin?",
    answer:
      "No. It is not a medical, dermatological, or skin-health tool, and it makes no health claims of any kind. It only estimates colour harmony for styling purposes.",
  },
  {
    question: "Does it recognise my face or identity?",
    answer:
      "No. Facial landmarks are used only to locate skin regions geometrically. No identity recognition is performed, no biometric templates are created, and nothing about your face is matched against anyone else's.",
  },
  {
    question: "Can I get an exact foundation shade?",
    answer:
      "We deliberately avoid that. Screen photos cannot capture skin accurately enough for shade matching, so we only suggest a warm, cool, or neutral undertone direction and recommend testing on your jawline in daylight.",
  },
  {
    question: "Where do the products come from?",
    answer:
      "The current catalogue contains clearly-labelled demonstration products created for this Final Year Project. The matching engine is real — products carry measured colour values ranked with CIEDE2000 — but purchases always happen on external stores.",
  },
  {
    question: "How do I delete my data?",
    answer:
      "Signed-in users can delete individual analyses, stored images, favourites, or the entire account from Settings. Deletion cascades through everything you own, including private storage objects.",
  },
];
