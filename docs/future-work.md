# Future Work

Ordered roughly by impact on result quality, then platform maturity.

## Measurement quality
1. **Physical calibration card** — a printable neutral-grey/colour-patch card held beside the face would allow true white-balance correction and turn the colour-cast *detector* into a *corrector*; the biggest single accuracy lever available.
2. **Improved white-balance calibration** — even without a card: sclera-based illuminant estimation and multi-frame capture averaging in the camera flow.
3. **Automatic hair and eye colour detection** — currently questionnaire-only by design (reliability); segmentation of hair regions and iris sampling would firm up the value/contrast dimensions, with the same quality-gating philosophy.

## Learning and evaluation
4. **Professionally labelled dataset** — partner with certified colour consultants to label a consented, demographically diverse photo set; unlocks real accuracy measurement.
5. **ML comparison against this baseline** — the spec-mandated path (§51): documented dataset/consent, leak-free splits, reproducible training, fairness evaluation, and the rule-based engine kept as the fallback until the model demonstrably wins. The versioned-config architecture already supports side-by-side algorithm versions.
6. **Expanded fairness evaluation** — grow the repeatability study across ITA bands with per-band reporting; add per-band quality-rejection monitoring to the admin stats.

## Product
7. **Real retailer APIs** — replace demo products via official affiliate/product APIs (colour metadata mapped into the existing Lab-tagged schema); the CSV pipeline already models ingestion.
8. **Wardrobe features** — outfit combinations from palette groups, seasonal capsule suggestions, shareable palette links (already image-free by design).
9. **Native mobile application** — camera control (exposure lock, RAW) far exceeds the browser's; the API is already mobile-ready.
10. **Personal stylist consultation mode** — export a consultant-readable report (measurements + palette) as a bridge between self-serve and professional service.

## Platform hardening
11. **Nonce-based CSP** to drop `unsafe-inline`.
12. **Redis-backed rate limiting** for horizontal scaling; move the limiter store out of process memory.
13. **Dependency-audit CI** (pnpm audit + pip-audit) and image scanning on the Docker build.
14. **Localisation** — Bahasa Melayu UI first; the copy layer is already centralised enough to extract.
