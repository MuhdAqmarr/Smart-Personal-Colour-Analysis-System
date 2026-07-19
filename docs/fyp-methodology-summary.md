# FYP Methodology Summary

Academic-ready summary for the Final Year Project report (spec §44). Companion documents: `colour-analysis-methodology.md` (technical depth), `evaluation-template.md` (study instruments), `testing-report.md` (verification evidence).

## 1. Problem statement

Choosing clothing and cosmetic colours that harmonise with one's natural colouring is difficult: undertone is hard to judge by eye, retail choice is overwhelming, and professional seasonal colour analysis is subjective, consultant-dependent, and costly. Existing "AI colour test" apps are typically opaque about method and privacy. This project asks whether a **transparent, rule-based, privacy-preserving web system** can produce a useful, explainable personal-colour estimate from a single facial photo and translate it into actionable fashion, cosmetic, and product recommendations.

## 2. Objectives (measurable)

| # | Objective | Success measure |
|---|---|---|
| O1 | Facial-image acquisition via camera and upload with guidance | Camera + upload flows pass E2E incl. denial fallback |
| O2 | Automated image-quality validation | 8-component 0–100 score; poor images rejected with specific, actionable feedback (tested per metric) |
| O3 | Landmark-based skin-region detection | Forehead + both cheeks located geometrically for detected faces; ≥400 usable pixels/ROI enforced |
| O4 | Colour-feature extraction in standard colour spaces | sRGB/HSV/XYZ/CIE Lab verified against canonical values; CIEDE2000 vs all 34 Sharma pairs |
| O5 | Undertone estimation | Deterministic warm/cool with internal neutral/uncertain states; boundary behaviour unit-pinned |
| O6 | Seasonal classification (4 seasons, 12 sub-seasons) | Prototype-based scoring; sub-season gated on confidence ≥ 0.6; boundaries unit-pinned |
| O7 | Personal palette generation | 156-colour curated catalogue over 8 wardrobe groups incl. hijab/headwear + gently-worded cautions |
| O8 | Product matching | Documented CIEDE2000 ranking over a colour-tagged directory; ordering behaviour unit-tested |
| O9 | Result storage with privacy controls | Opt-in-only image storage; per-item/history/account deletion, integration-verified |

## 3. Scope

**Included:** guest + registered analysis; quality gating; rule-based classification with confidence and explanations; palettes/cosmetics; demo product directory with CSV administration; admin portal; RLS-secured persistence; deployment configuration. **Excluded:** real-time video, automatic hair/eye-colour detection, live retailer APIs, native mobile apps, trained ML models, medical/dermatological claims. **Assumptions:** front-facing single-person photos; users can follow lighting guidance; sRGB capture. **Limitations:** no physical white-balance reference; lighting dominates error; thresholds are documented heuristics, not fitted parameters.

## 4. Methodology

Engineering method: specification-driven phased delivery (14 phases) with per-phase verification (format, lint, strict typing, tests, build) and CI on every merge. The analysis method is fully described in `colour-analysis-methodology.md`; in brief: hardened decode → MediaPipe landmarks (geometry only) → landmark-anchored elliptical ROIs → robust pixel statistics (MAD rejection, trimmed means) → exact sRGB→Lab (D65) → weighted rule scoring for undertone → prototype matching over four normalised dimensions for season/sub-season → six-factor confidence → template-based explanation from measured signals. All thresholds live in a versioned configuration stamped onto every result.

## 5. Evaluation approach (honest framing)

No professionally-labelled personal-colour dataset was available, so the evaluation reports **technical consistency, robustness, and usability — not classification accuracy**:

1. **Determinism** — identical input ⇒ identical output (automated).
2. **Reference correctness** — colour mathematics vs published values (automated).
3. **Degradation behaviour** — dark/bright/blurred/cast/multi-face/tiny-face inputs must be rejected or flagged with correct codes (automated).
4. **Boundary behaviour** — synthetic Lab vectors spanning documented skin-tone ranges (incl. ITA-informed light↔deep coverage) map to the expected seasons (automated).
5. **Repeatability under variation** *(human study, template provided)* — same participant, multiple photos/lighting: does the season stay stable? Report agreement rates.
6. **Face validity & usability** *(human study, template provided)* — participant + jewellery-preference agreement, SUS-style usability items, task completion.
7. **Fairness sweep** *(protocol provided)* — repeat 5 across diverse skin-tone ranges; report per-band detection/rejection/confidence behaviour without inventing accuracy numbers.

## 6. Results available for the report

189 unit + 56 integration + 21 RLS + 24 web + 30 E2E automated checks green; zero serious/critical WCAG 2.1 A/AA violations on key pages; warm-path analysis ≈15 ms server-side (cold ≈770 ms incl. model load); deterministic outputs verified; production container proven including the vision path.

## 7. Future work

See `future-work.md` (calibration card, labelled datasets, ML comparison against this rule-based baseline, retailer APIs, native apps, nonce CSP, fairness expansion).
