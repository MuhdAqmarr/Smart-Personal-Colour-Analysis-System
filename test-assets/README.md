# Test assets

All test imagery is **generated at test time** — nothing is scraped, nothing personal is committed, and the suite is fully hermetic. Generators live in `apps/api/tests/fixtures.py`.

## Origins and licences

| Fixture | Construction | Licence / origin |
|---|---|---|
| `valid_face` | scikit-image's bundled `astronaut` photograph (Eileen Collins), upscaled to 640px | **Public domain** — NASA photograph distributed with scikit-image |
| `no_face` | Deterministic gradient + seeded Gaussian noise | Generated |
| `multiple_faces` | Two close-cropped copies of the astronaut's head, one mirrored | Public-domain derivative |
| `too_dark` / `too_bright` | Astronaut ×0.10 / ×2.6 with clipping | Derivative |
| `blurred` | Astronaut with Gaussian blur σ=4 (still detectable; sharpness variance ≈12, far below the 45 threshold) | Derivative |
| `yellow/blue/red/green_cast` | Astronaut with per-channel gains simulating coloured light | Derivative |
| `tiny_face` | Astronaut at 360px pasted on a 1600px neutral canvas | Derivative |
| `rotated_face` | Astronaut rotated 20° in-plane (roll-detection test) | Derivative |
| Skin-tone matrices | Synthetic Lab-range patches spanning documented ITA bands (classifier unit tests) | Generated |

## Detector characteristics worth knowing

The vendored MediaPipe Face Landmarker bundle uses a **short-range (selfie) face detector**: faces need to occupy a substantial share of the frame to be found. That is the correct trade-off for this product (users photograph themselves at arm's length) and is why:

- the multi-face fixture composites **close-cropped heads** rather than full frames;
- very small faces may report `NO_FACE_DETECTED` rather than `FACE_TOO_SMALL` — both lead the user to the same fix (move closer), and tests accept either code where the boundary is detector-dependent.

## Adding real evaluation photos (optional, local only)

For the FYP evaluation you may test with **consented** photos of volunteers:

1. Place files under `test-assets/local/` — that directory is git-ignored; never commit personal photos.
2. Record consent (name, date, purpose) in your evaluation log, not in the repository.
3. Use the running app or `POST /api/v1/analyses/preview-quality` directly.
4. Delete the files after the evaluation session.

The generated fixture set intentionally spans lighting and cast conditions; diversity of *real* skin tones in the committed suite is covered by synthetic Lab patches at classifier level, and the fairness methodology (docs/fyp) explains how to run consented human evaluation without storing anyone's face in git.
