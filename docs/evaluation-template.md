# Evaluation Templates

Instruments for the human-facing evaluation (spec §44.5). Automated evidence lives in `testing-report.md`. Store filled forms outside the repository; never commit participant photos (see `test-assets/README.md`).

## A. Functional test cases (fill during a release check)

| ID | Scenario | Steps | Expected | Pass/Fail | Notes |
|---|---|---|---|---|---|
| F1 | Guest analysis | Consent → upload valid photo → analyse | Result with undertone, season, confidence, palette | | |
| F2 | Camera capture | Enable camera → capture → analyse | As F1 | | |
| F3 | Camera denied | Block permission → try camera | Auto-switch to Upload with explanation | | |
| F4 | No face | Upload landscape photo | Specific retake message | | |
| F5 | Multiple faces | Photo with two people | MULTIPLE_FACES message | | |
| F6 | Dark photo | Heavily underexposed photo | Rejected with lighting tips | | |
| F7 | Save + history | Sign in → analyse → open history → detail | Persisted; palette + products render | | |
| F8 | Image opt-in | Consent box ticked → analyse → detail | Photo visible via signed URL; deletable | | |
| F9 | Deletion | Delete analysis / history / account | Data gone; sign-out on account deletion | | |
| F10 | Admin gate | Normal user opens /admin | Access refused | | |
| F11 | CSV import | Dry-run sample CSV → commit | Preview correct; rows inserted; audit entry | | |
| F12 | Mobile | Run F1 at 375px width | Fully usable, no horizontal scroll | | |

## B. Repeatability protocol (consistency, not accuracy)

Per participant (target n ≥ 10, diverse skin tones):

1. Three photos in **daylight** (window, front-lit), taken minutes apart.
2. One photo in **warm indoor light**; one with **mild backlight**.
3. Record for each: quality score, undertone, undertone score, season, sub-season (if shown), confidence.

| Participant | Photo | Quality | Undertone (score) | Season | Sub-season | Confidence |
|---|---|---|---|---|---|---|
| P01 | D1 | | | | | |
| P01 | D2 | | | | | |
| P01 | D3 | | | | | |
| P01 | W1 | | | | | |
| P01 | B1 | | | | | |

Report: daylight season-agreement rate (D1–D3), undertone-score spread, warm-light shift direction (expect warm-shift or cast rejection — both acceptable behaviours), confidence deltas. **Do not** present agreement as accuracy.

## C. Participant feedback form

Likert 1–5 (strongly disagree → strongly agree):

1. The consent explanation was clear.
2. The photo guidance was easy to follow.
3. I understood *why* I received this result.
4. The confidence level matched how sure the system seemed.
5. The fashion palette feels wearable for me.
6. The cosmetic directions feel usable for me.
7. I would trust this as a starting point for shopping.
8. I felt in control of my data.

Open questions: Which recommended colour surprised you (good/bad)? Did the result match jewellery you already prefer (gold/silver/both)? Anything confusing?

## D. Performance log

| Metric | How | Values |
|---|---|---|
| Warm analysis latency (server) | `processingMs` from 10 responses | |
| Cold start (Render free tier) | First request after ≥15 min idle | |
| End-to-end wizard time | Stopwatch consent→result, 5 runs | |
| Quality-rejection rate | Rejections ÷ attempts during study | |

## E. Failure & limitation log

| Case | Input condition | Behaviour observed | Classified as (expected guardrail / genuine limitation) |
|---|---|---|---|
| | | | |
