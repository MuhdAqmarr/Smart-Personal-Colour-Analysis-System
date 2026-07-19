# Classifier Configuration

Every tunable number in the analysis pipeline lives in **`packages/colour-engine/config/classifier-v1.json`** — field-by-field documentation is in [`packages/colour-engine/README.md`](../packages/colour-engine/README.md), and the scoring semantics in [`colour-analysis-methodology.md`](./colour-analysis-methodology.md).

## How the configuration is used

- The API loads and **validates** the file at startup (`app/core/classifier.py`): weight groups must sum to 1.0, all four season prototypes must exist, formats/thresholds are type-checked. A broken config refuses to boot with a readable error.
- Every result carries `classifierVersion`; persisted analyses also reference the `algorithm_versions` row, which stores the **full config snapshot** for reproducibility (seeded by `scripts/generate_seed.py`).
- Path resolution: repo layout → `packages/colour-engine/config/classifier-v1.json`; container → `/app/config/classifier-v1.json`; override with `CLASSIFIER_CONFIG_PATH`.

## Changing thresholds — the rules

1. **Never edit a released version in place.** Copy to `classifier-v2.json`, bump `version`, adjust values.
2. Justify the change in `DECISIONS.md` (what moved, why, expected effect).
3. Update the loader/default path (or `CLASSIFIER_CONFIG_PATH`) and regenerate the seed so a new `algorithm_versions` row snapshots v2 (`python3 scripts/generate_seed.py` — CI fails if the seed drifts from its generator).
4. Run the API suite — classifier boundary tests pin behaviour and will surface every consequence of the change.
5. Old results remain interpretable: they keep their version stamp and stored measurements.

## Tuning history

| Version | Change | Reason |
|---|---|---|
| 1.0.0 (pre-release) | `colourCast.warnAbShift` 5→12, `maxAbShift` 10→22 | Real-photo gray-world testing: legitimate colourful scenes (e.g. the public-domain astronaut frame) measure ~11 ΔE_ab; the original thresholds blocked valid photos. |

## Quick reference of the sections

`image` (upload limits, resize target, bomb ceiling) · `quality` (component weights, per-metric thresholds, min score 55) · `roi` (ellipse geometry factors, pixel-filter bounds, MAD k, trim fraction) · `undertone` (hue/b\* bands, signal weights, neutral band, questionnaire cap) · `dimensions` (value/chroma/contrast mappings) · `seasons` (dimension weights + 4 prototypes) · `subSeasons` (axis thresholds, priority order, display gate 0.60) · `confidence` (6 factor weights, label cut-offs) · `productMatching` (ranking weights, ΔE falloff 25, cap 24).
