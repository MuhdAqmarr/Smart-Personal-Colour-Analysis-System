# @coloursense/colour-engine — Versioned Classifier Configuration

Single source of truth for **every threshold and weight** used by the Match.Lab rule-based colour-analysis engine. The Python backend (`apps/api`) loads and validates `config/classifier-v1.json` at startup and stamps every analysis result with its `version`. Nothing in the pipeline may hard-code a tunable number.

> The engine is deterministic and rule-based. These values are documented heuristics grounded in colour science (CIE Lab, ITA bands, CIEDE2000) — not trained parameters. Changing any value requires a version bump and a new file (`classifier-v2.json`), keeping historical results reproducible.

## Field documentation

### `image`
| Field | Meaning |
|---|---|
| `maxUploadMb` | Hard upload size cap (also enforced at the edge) |
| `allowedFormats` | Decoded formats accepted after magic-byte sniffing |
| `maxAnalysisEdgePixels` | Longest edge after downscale (aspect preserved) |
| `maxDecodedPixels` | Decompression-bomb ceiling (Pillow `MAX_IMAGE_PIXELS`) |
| `minEdgePixels` | Reject images too small to analyse reliably |

### `quality`
Composite quality score = `Σ componentScore × componentWeights` (weights sum to 1), scaled to 0–100. Analysis stops below `minOverallScore` unless `allowLowQualityContinuation` (or an explicit user override in the request, surfaced in the UI as a warned choice).

- `faceSize` — face bounding-box width relative to image width; linear score between `min` and `good` ratios.
- `pose` — |yaw|/|pitch|/|roll| from the MediaPipe facial transformation matrix; between `warn*` and `max*` the score decays linearly; beyond `max*` the image is rejected (`POSE_TOO_EXTREME`).
- `blur` — variance of Laplacian computed on the face crop resized to `faceCropAnalysisWidth` px (scale-invariant); linear score between `min` and `good` variance.
- `exposure` — mean luma (BT.601 Y of the face region), dark-pixel ratio, highlight/shadow clipping ratios, local contrast (std of Y). Statuses: `too_dark`, `too_bright`, `strong_shadow`, `low_contrast`, `acceptable`.
- `lighting` — mean-luma deltas between left/right face halves and forehead vs cheeks; `warn*` → score decay, `max*` → `UNEVEN_LIGHTING`.
- `colourCast` — Lab a\*/b\* shift of the estimated illuminant: gray-world estimate over the frame blended with face-region neutrality expectation (`grayWorldWeight`/`faceConsistencyWeight`). Direction reported as yellow/blue/red/green when |shift| > `warnAbShift`.
- `skinArea` — usable-pixel ratio after ROI pixel filtering.

### `roi`
Skin regions are **elliptical polygons anchored to facial landmarks** (never fixed pixel boxes):
- Forehead: centre sits `centreGlabellaToOvalTopFraction` of the way from the glabella to the top of the face oval; semi-axes scale with inter-temple distance.
- Cheeks: centre at `eyelidToMouthCornerFraction` between lower-eyelid and mouth-corner anchors, pushed `towardFaceEdgeFraction` toward the face edge; semi-axes scale with face width.
- `pixelFilter` — candidate pixels are kept when `minLStar ≤ L* ≤ maxLStar`, chroma ≤ `maxChroma`, not specular (`L* > highlightLStar` with chroma < `highlightChromaMax` rejected); then median-absolute-deviation rejection at `madK`; aggregation uses median + `trimmedMeanFraction` trimmed mean.

### `undertone`
Signals (each mapped to a warm(+1)/cool(−1) score): hue angle `hab = atan2(b*, a*)` with cool/warm bounds, absolute `b*` level, and left/right/forehead agreement. Combined with `signalWeights`. |score| ≤ `neutralBandWidth` ⇒ internal class `neutral` (user-facing output then leans on the sign but is labelled low-confidence). Quality below `uncertainQualityBelow` ⇒ `uncertain`. Optional questionnaire adjusts by at most `questionnaireWeight`.

### `dimensions`
Maps measured features to the four classification dimensions, each normalised to [0, 1]:
- `value` from mean skin L\* (`scoreLow`→0, `scoreHigh`→1); bands: light ≥ `lStarLightMin`, deep ≤ `lStarDeepMax`.
- `chroma` from mean skin C\*ab.
- `contrast` from ROI L\* spread (weak image proxy) blended with the optional questionnaire (`questionnaireWeight`); defaults to `defaultScore` when neither is reliable.

### `seasons`
Each season has a prototype vector over (temperature, value, chroma, contrast). Season score = `1 − Σ dimensionWeights·|dim − prototype|`. Highest score wins; the top-two margin feeds confidence.

### `subSeasons`
Within the winning season, the deviating axis picks the sub-season (priority order per season; first matching rule wins; otherwise the season's "true" default, e.g. `warm-spring`). Sub-seasons are only *displayed* when overall confidence ≥ `minConfidence`.

### `confidence`
Confidence (0–1, separate from classification score) = weighted sum of: normalised image quality, ROI consistency (CIEDE2000 between cheeks and cheeks↔forehead mapped from `deltaEGood`→1 to `deltaEPoor`→0), usable skin area, top-two classification margin, colour-cast penalty, questionnaire agreement. Labels: `high ≥ highMin`, `medium ≥ mediumMin`, else `low`.

### `productMatching`
Product score = `0.5·paletteProximity + 0.2·seasonTag + 0.1·subSeasonTag + 0.1·categoryRelevance + 0.1·availability`, where `paletteProximity = max(0, 1 − ΔE00_min / deltaE00Falloff)` against the user's recommended palette colours. Documented in `docs/colour-analysis-methodology.md`.

## Versioning rules
1. Never edit a released config in place — copy to `classifier-v{n+1}.json`, bump `version`.
2. The API records versions in the `algorithm_versions` table and stamps results.
3. Threshold changes must be justified in `DECISIONS.md`.
