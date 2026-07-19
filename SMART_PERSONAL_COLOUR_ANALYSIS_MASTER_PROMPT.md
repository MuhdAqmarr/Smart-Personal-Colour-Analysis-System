# Master Engineering Prompt — Smart Personal Colour Analysis System

> **Target agent:** Claude / Fable 5 coding agent  
> **Repository:** `https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git`  
> **Default branch:** `main`  
> **Target completion:** Production-ready FYP application, including deployment preparation and documentation  
> **Primary deployment:** Vercel + Render + Supabase

---

## 0. Read This First

You are the **Principal Software Architect, Senior Full-Stack Engineer, Computer Vision Engineer, Database Engineer, DevOps Engineer, Security Engineer, QA Lead, UI/UX Engineer, and Technical Documentation Writer** responsible for delivering this project from an empty GitHub repository to a complete, tested, documented, secure, responsive, and production-deployable application.

Read this document completely before modifying any files.

Treat the following terms as binding:

- **MUST**: mandatory requirement.
- **SHOULD**: implement unless a documented technical reason prevents it.
- **MAY**: optional enhancement.

Do not stop after generating a plan, mock-up, sample snippet, pseudo-code, static interface, or incomplete prototype. Build the real application.

The finished project MUST include:

- Responsive frontend application.
- Backend API.
- PostgreSQL database.
- Authentication and authorisation.
- Facial-image capture and upload.
- Image-quality validation.
- Facial-landmark and skin-region extraction.
- Skin-colour feature extraction.
- Undertone estimation.
- Seasonal colour classification.
- Personal fashion palettes.
- Cosmetic colour recommendations.
- Product and e-commerce recommendation module.
- Registered-user dashboard.
- Administrator portal.
- Privacy controls and deletion flows.
- Automated tests.
- Docker configuration.
- CI workflows.
- Deployment configuration.
- Technical and FYP documentation.
- GitHub commits and pushed branches.

Work autonomously and systematically.

Do not repeatedly ask for confirmation where a reasonable, safe default is already defined in this specification.

Only stop and ask the owner when:

1. A required production credential is unavailable.
2. A destructive or irreversible action requires approval.
3. A paid external service must be purchased.
4. A major requirement is genuinely ambiguous and cannot be inferred safely.
5. A production deployment action requires access that has not been granted.
6. A legal, licensing, privacy, or security issue cannot be resolved safely without owner input.

Otherwise, continue implementing.

---

# 1. GitHub Repository and Source-Control Requirements

This project MUST be developed in and pushed to the following repository:

- **Owner:** `MuhdAqmarr`
- **Repository:** `Smart-Personal-Colour-Analysis-System`
- **Clone URL:** `https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git`
- **Default branch:** `main`

The repository may currently be empty.

## 1.1 Repository initialisation

If the current directory is not already the repository, run:

```bash
git clone https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git
cd Smart-Personal-Colour-Analysis-System
```

If project files already exist locally but the remote is missing, configure it safely:

```bash
git remote add origin https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git
```

Before making changes, verify:

```bash
git status
git remote -v
git branch --show-current
gh auth status || true
gh repo view MuhdAqmarr/Smart-Personal-Colour-Analysis-System || true
```

Do not overwrite uncommitted work. Do not delete existing code without understanding its purpose.

## 1.2 Git workflow

Use a stable branch workflow.

Recommended long-lived branches:

- `main`: stable and deployable.
- `develop`: integration branch, if beneficial for the project.

Recommended feature branches:

- `feat/project-foundation`
- `feat/database-authentication`
- `feat/design-system`
- `feat/image-acquisition`
- `feat/image-quality-engine`
- `feat/colour-analysis-engine`
- `feat/analysis-results`
- `feat/palette-recommendations`
- `feat/product-recommendations`
- `feat/admin-portal`
- `test/system-hardening`
- `docs/fyp-documentation`
- `chore/production-deployment`

For each major phase:

1. Synchronise the base branch.
2. Create a properly named branch.
3. Implement the scoped work.
4. Run formatting.
5. Run linting.
6. Run type checking.
7. Run relevant tests.
8. Run a production build where applicable.
9. Review all changes.
10. Verify that no secret or sensitive file is included.
11. Create logical commits.
12. Push the branch to GitHub.
13. Create or prepare a pull request.
14. Include implementation details, risks, screenshots where useful, and test results in the pull-request description.

Use Conventional Commits where practical:

```text
chore: initialise project monorepo
docs: add architecture and project plan
feat(auth): implement Supabase authentication
feat(analysis): add image quality validation
feat(colour-engine): implement CIE Lab colour extraction
feat(palette): add seasonal colour recommendations
feat(products): implement product colour matching
feat(admin): add product management portal
test(analysis): add image-processing test coverage
fix(security): enforce analysis ownership
ci: add frontend and backend checks
docs: add deployment and FYP methodology guides
```

After every verified major phase, push the work. Do not leave completed work only on the local machine.

## 1.3 Git safety

Never:

- Commit real `.env` files.
- Commit Supabase service-role keys.
- Commit JWT secrets.
- Commit database passwords.
- Commit deployment tokens.
- Commit private facial images.
- Commit temporary upload files.
- Commit `node_modules`.
- Commit Python virtual environments.
- Commit generated caches.
- Commit IDE credentials.
- Expose secrets in GitHub Actions logs.
- Force-push to `main`.
- Rewrite shared Git history.
- Delete the repository.
- Delete remote branches without explicit approval.
- Merge failing code into `main`.
- Disable failing checks merely to complete a phase.

Use GitHub Secrets for CI/CD credentials.

Before important pushes, run:

```bash
git status
git diff --check
git log -1 --oneline
git remote -v
```

Run an available secret scanner before production-related merges.

If GitHub authentication is unavailable:

1. Continue working safely and commit locally.
2. Do not discard work.
3. Report the exact authentication blocker.
4. Ask the owner to authenticate through GitHub CLI or another secure method.
5. Resume pushing after authentication is available.

---

# 2. Project Identity

## 2.1 Project title

**Smart Personal Colour Analysis System**

Suggested product name for the interface:

**ColourSense**

The product name may be changed later through configuration without requiring major refactoring.

## 2.2 Project type

This is a **Final Year Project responsive web application** that analyses a user-provided facial image and returns an estimated personal colour profile.

The system is intended for:

- FYP assessment.
- Academic report and presentation.
- Technical demonstration.
- Controlled user testing.
- Cloud deployment.
- Future commercial enhancement.

## 2.3 Core user outcome

A user should be able to:

1. Register, sign in, or continue as a guest.
2. Read consent and privacy information.
3. Capture a facial image using a camera.
4. Upload a facial image from a gallery.
5. Receive photography guidance.
6. Validate whether the image is suitable.
7. Detect exactly one usable face.
8. Analyse forehead and cheek skin regions.
9. Extract representative skin colours.
10. View RGB, HEX, HSV/HSL, XYZ, and CIE Lab values where appropriate.
11. Receive an estimated warm or cool undertone.
12. Receive one of four major seasons: Spring, Summer, Autumn, or Winter.
13. Receive a sub-season when confidence is sufficient.
14. View personalised fashion colours.
15. View cosmetic colour suggestions.
16. View colours to use cautiously.
17. Save analyses when authenticated.
18. Review and delete previous analyses.
19. View matching products.
20. Filter products.
21. Open external product links safely.
22. Manage consent and image-storage preferences.
23. Delete stored images and user-owned data.

---

# 3. Product Positioning, Ethics, and Limitations

The application is a **personal styling and educational recommendation tool**.

It is not:

- A medical application.
- A dermatology diagnosis system.
- A skin-health assessment tool.
- A facial identification system.
- A biometric identity system.
- A guaranteed replacement for a professional colour consultant.
- A scientifically proven classifier unless measured and validated appropriately.

Use language such as:

- “Estimated undertone”.
- “Suggested colour season”.
- “Confidence score”.
- “Personal styling recommendation”.
- “Results may vary depending on lighting and camera conditions”.

Do not claim artificial intelligence unless an actual trained and evaluated ML model exists.

If the system uses deterministic image processing, colour science, configurable thresholds, and rule-based scoring, describe it honestly as a rule-based or hybrid colour-analysis engine.

Do not invent accuracy numbers.

Clearly disclose that results may be affected by:

- Camera sensor and image quality.
- Compression.
- Beauty filters.
- Makeup.
- White balance.
- Artificial lighting.
- Yellow or coloured lighting.
- Shadows.
- Overexposure.
- Underexposure.
- Hair covering the face.
- Eyeglasses.
- Coloured contact lenses.
- Facial pose.
- Background reflections.
- Inaccurate optional questionnaire answers.

---

# 4. Required Technology Stack

Use current stable versions available at implementation time. Avoid deprecated APIs. When uncertain, consult official documentation.

## 4.1 Frontend

Use:

- Next.js with App Router.
- React.
- TypeScript with strict mode.
- Tailwind CSS.
- shadcn/ui or another accessible headless component library.
- React Hook Form.
- Zod.
- TanStack Query.
- Supabase JavaScript client.
- Browser MediaDevices API.
- Canvas API.
- Lucide icons.
- Sonner or an equivalent accessible notification system.
- Vitest.
- React Testing Library.
- Playwright.

Use Server Components where appropriate. Use Client Components only where browser interaction is required.

## 4.2 Backend

Use:

- Python.
- FastAPI.
- Pydantic.
- SQLAlchemy or a suitable Supabase/PostgreSQL access layer.
- OpenCV.
- NumPy.
- Pillow.
- MediaPipe Face Landmarker or another maintained face-landmark solution.
- scikit-image where useful.
- pytest.
- httpx.
- Ruff.
- MyPy or Pyright.
- Structured JSON logging.

The backend MUST be containerised.

## 4.3 Database, authentication, and storage

Use:

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- PostgreSQL Row Level Security.
- SQL migrations.
- Seed scripts.

The backend MUST validate Supabase JWTs before accessing protected user resources.

## 4.4 Deployment

Prepare for:

- Frontend: Vercel.
- Backend API: Render using Docker.
- Database/Auth/Storage: Supabase.
- Source control: GitHub.
- CI: GitHub Actions.

Provide Railway notes only as an optional alternative.

## 4.5 Package management

Use:

- `pnpm` for JavaScript and TypeScript.
- `uv` with `pyproject.toml` for Python, unless an existing repository standard makes another choice safer.

---

# 5. Monorepo Architecture

Use a clean monorepo unless the repository already contains a valid, compatible structure.

Recommended layout:

```text
Smart-Personal-Colour-Analysis-System/
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── contracts/
│   ├── colour-engine/
│   ├── shared-config/
│   └── eslint-config/
├── supabase/
│   ├── migrations/
│   ├── policies/
│   └── seed.sql
├── docs/
│   ├── architecture/
│   ├── api/
│   ├── database/
│   ├── deployment/
│   ├── fyp/
│   ├── security/
│   └── testing/
├── scripts/
├── test-assets/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── pnpm-workspace.yaml
├── CLAUDE.md
├── README.md
├── PROJECT_PLAN.md
├── PROJECT_STATUS.md
├── ARCHITECTURE.md
├── DECISIONS.md
├── SECURITY_AND_PRIVACY.md
├── TESTING_STRATEGY.md
└── .gitignore
```

Recommended backend organisation:

```text
apps/api/
├── app/
│   ├── api/
│   │   └── v1/
│   ├── core/
│   ├── schemas/
│   ├── repositories/
│   ├── services/
│   ├── security/
│   ├── analysis/
│   │   ├── preprocessing/
│   │   ├── face_detection/
│   │   ├── landmarks/
│   │   ├── quality/
│   │   ├── skin_regions/
│   │   ├── colour_features/
│   │   ├── classification/
│   │   ├── confidence/
│   │   └── explainability/
│   └── main.py
└── tests/
```

Keep HTTP route logic thin. Keep analysis logic modular and independently testable.

---

# 6. Mandatory Planning and Status Files

Before major implementation, create:

- `PROJECT_PLAN.md`
- `PROJECT_STATUS.md`
- `ARCHITECTURE.md`
- `DECISIONS.md`
- `SECURITY_AND_PRIVACY.md`
- `TESTING_STRATEGY.md`

## 6.1 `PROJECT_PLAN.md`

Include:

- Project phases.
- Individual tasks.
- Dependencies.
- Acceptance criteria.
- Technical risks.
- Security risks.
- Privacy risks.
- Complexity estimates.
- Status checkboxes.

## 6.2 `PROJECT_STATUS.md`

Include:

- Overall percentage.
- Current phase.
- Completed work.
- In-progress work.
- Blockers.
- Tests executed.
- Latest test results.
- Build results.
- Latest Git branch and commit.
- Next actions.

Update after each major phase.

## 6.3 Decision records

Use `DECISIONS.md` or an ADR directory to document important technical choices, including:

- Why a rule-based baseline was selected.
- Why CIE Lab and CIEDE2000 were selected.
- Image-retention policy.
- Supabase RLS approach.
- Backend deployment target.
- Face-landmark library selection.
- Threshold and configuration versioning.

---

# 7. User Roles

## 7.1 Guest

Can:

- View public pages.
- Read colour-season information.
- Capture or upload a facial image.
- Perform a temporary analysis.
- View temporary results.
- View public product recommendations.

Cannot:

- Permanently save analyses.
- View analysis history.
- Save favourites.
- Access administrative features.

Guest image data MUST not be permanently stored.

## 7.2 Registered user

Can:

- Perform analyses.
- Save analysis results.
- Review prior analyses.
- Delete individual analyses.
- Delete stored images.
- Save favourite colours.
- Save favourite products.
- Manage profile data.
- Manage consent.
- Manage image-storage preferences.
- Delete account data.

## 7.3 Administrator

Can:

- Manage colour seasons.
- Manage sub-seasons.
- Manage fashion palettes.
- Manage cosmetic recommendations.
- Manage stores.
- Manage products.
- Import products by CSV.
- Activate or deactivate records.
- View anonymised analytics.
- View algorithm versions.
- Manage selected public content.
- Review system health.

Administrators MUST NOT casually browse users’ private source facial images.

Protect admin actions on both frontend and backend.

---

# 8. Required Pages

## 8.1 Public pages

- Home.
- How It Works.
- Colour Seasons.
- Frequently Asked Questions.
- Privacy Policy.
- Terms of Use.
- Analysis Disclaimer.
- Sign In.
- Registration.
- Forgot Password.
- Reset Password.

## 8.2 Analysis wizard

Use a guided multi-step flow:

1. Introduction and consent.
2. Photography instructions.
3. Camera capture or image upload.
4. Preview and retake.
5. Automated image-quality validation.
6. Optional natural hair and eye questionnaire.
7. Processing.
8. Result overview.
9. Detailed explanation.
10. Fashion palette.
11. Cosmetic palette.
12. Product recommendations.
13. Save or retake.

## 8.3 Registered-user pages

- Dashboard.
- New Analysis.
- Saved Analyses.
- Analysis Details.
- Saved Palettes.
- Favourite Colours.
- Recommended Products.
- Favourite Products.
- Profile.
- Privacy Settings.
- Account Settings.

## 8.4 Administrator pages

- Admin Dashboard.
- Colour Seasons.
- Sub-Seasons.
- Fashion Palettes.
- Cosmetic Recommendations.
- Stores.
- Products.
- Product CSV Import.
- Import History.
- Algorithm Versions.
- Content Management.
- Audit Logs.
- System Health.

---

# 9. UI and Visual Direction

Create a modern beauty-technology interface that is:

- Premium but suitable for an academic project.
- Clean and professional.
- Mobile-first.
- Inclusive across genders and skin tones.
- Built around colour swatches and palette cards.
- Accessible.
- Not excessively pink or stereotypically feminine.
- Free of copyrighted brand assets.

Landing-page sections:

1. Navigation.
2. Hero with primary call to action.
3. How the system works.
4. Four major colour seasons.
5. Personal fashion palette explanation.
6. Cosmetic recommendation explanation.
7. Product matching explanation.
8. Privacy statement.
9. FAQ.
10. Final call to action.
11. Footer.

Use internally created swatches, icons, simple illustrations, and placeholders where necessary.

---

# 10. Camera Capture and Image Upload

## 10.1 Camera capture

Use the browser MediaDevices API.

Requirements:

- Request permission only after a user action.
- Prefer front-facing camera on mobile.
- Support camera switching where available.
- Display a face-position guide.
- Provide capture and retake actions.
- Stop all camera tracks after capture or when leaving the page.
- Handle denied permission clearly.
- Handle unavailable cameras.
- Explain HTTPS requirement.
- Never record video.
- Capture only a still image selected by the user.

## 10.2 Upload

Accepted formats:

- JPEG.
- PNG.
- WebP.

Default maximum size:

- 10 MB, configurable.

Validate:

- Extension.
- Browser-reported MIME type.
- Actual decoded content.
- Dimensions.
- File size.
- Decode success.

Correct EXIF orientation.

Resize oversized images while preserving aspect ratio.

Default maximum analysis dimension:

- 1600 pixels on the longest edge.

## 10.3 Photography guidance

Tell users to:

- Face the camera directly.
- Use natural daylight where possible.
- Avoid yellow or coloured lighting.
- Avoid strong makeup.
- Avoid filters.
- Remove coloured glasses.
- Keep forehead and cheeks visible.
- Avoid deep shadows.
- Avoid overexposure.
- Use a neutral background.
- Include only one person.
- Keep the face sufficiently close to the camera.

---

# 11. Privacy, Consent, and Data Retention

Facial images are sensitive personal data.

Explicit consent is required before analysis.

The consent screen MUST explain:

- Why the image is required.
- Which facial regions are analysed.
- That identity recognition is not performed.
- Whether the image is temporary or stored.
- Which derived values may be saved.
- How the user can delete data.

Default behaviour:

- Process images temporarily.
- Do not permanently store original images.
- Delete temporary files after processing.
- Save only derived features and result records for authenticated users.

Add an optional checkbox:

> Save my analysis image for future comparison.

This option MUST be off by default.

When enabled:

- Store the file in a private Supabase Storage bucket.
- Use a user-specific path.
- Enforce storage policies.
- Use signed URLs.
- Never expose a permanent public URL.
- Allow deletion by the owner.

Users MUST be able to delete:

- Individual analyses.
- Individual stored images.
- Complete analysis history.
- Saved favourites.
- Their account and associated user-owned data.

Document retention behaviour precisely.

---

# 12. Image-Analysis Pipeline

Build a modular, deterministic, testable pipeline:

```text
Input image
→ File and security validation
→ Decode validation
→ EXIF orientation correction
→ Resize
→ Face detection
→ Face-count validation
→ Face-size validation
→ Face-pose validation
→ Blur detection
→ Exposure validation
→ Lighting-consistency validation
→ Environmental colour-cast estimation
→ Face-landmark extraction
→ Forehead ROI generation
→ Left-cheek ROI generation
→ Right-cheek ROI generation
→ Skin-pixel candidate selection
→ Highlight rejection
→ Shadow rejection
→ Statistical outlier rejection
→ Robust colour aggregation
→ RGB calculation
→ HEX calculation
→ HSV/HSL calculation
→ CIE XYZ calculation
→ CIE Lab calculation
→ Undertone estimation
→ Major-season classification
→ Sub-season classification
→ Confidence calculation
→ Explainability generation
→ Palette recommendation
→ Product recommendation
```

Each stage MUST return structured results and meaningful errors.

Do not mix pipeline logic into FastAPI route handlers.

---

# 13. Image-Quality Validation

## 13.1 Face count

Require exactly one clearly visible face.

Return friendly errors for:

- No face detected.
- Multiple faces detected.
- Face too small.
- Face partially outside frame.
- Landmarks unavailable.

## 13.2 Pose

Estimate:

- Yaw.
- Pitch.
- Roll.

Warn or reject excessive:

- Side rotation.
- Upward/downward angle.
- Tilt.

Keep thresholds in versioned configuration.

## 13.3 Blur

Use a defensible sharpness metric such as variance of Laplacian.

Do not scatter unexplained thresholds through the code.

## 13.4 Exposure and lighting

Calculate:

- Mean luminance.
- Dark-pixel ratio.
- Highlight-clipping ratio.
- Shadow-clipping ratio.
- Local contrast.
- Brightness distribution.
- Lighting consistency across facial regions.

Return statuses such as:

- Acceptable.
- Too dark.
- Too bright.
- Strong shadow.
- Uneven lighting.
- Low contrast.

## 13.5 Colour cast

Estimate excessive:

- Yellow cast.
- Blue cast.
- Red cast.
- Green cast.

Use a documented combination of:

- RGB channel balance.
- Gray-world estimate.
- Face-region consistency.
- Local lighting consistency.

Prefer requesting a better image instead of aggressively correcting an unreliable image.

## 13.6 Quality score

Return an overall score from 0 to 100.

Include component scores for:

- Face detection.
- Face size.
- Face pose.
- Sharpness.
- Exposure.
- Lighting consistency.
- Colour cast.
- Usable skin area.

When minimum quality is not met:

- Explain the problem.
- Explain how to retake the photo.
- Stop normal classification by default.
- Permit low-confidence continuation only through an explicit configuration or user choice.

---

# 14. Facial-Landmark and Skin-Region Extraction

Use facial landmarks to create polygon masks for:

- Central forehead.
- Left cheek.
- Right cheek.

Optional:

- Chin.
- Jaw.

Avoid:

- Eyes.
- Eyebrows.
- Lips.
- Nostrils.
- Hair.
- Background.
- Clothing.
- Eyeglasses.
- Specular highlights.
- Deep shadows.

Do not use fixed pixel rectangles.

Generate regions relative to facial geometry.

For each ROI:

1. Generate polygon mask.
2. Extract candidate pixels.
3. Reject extreme dark pixels.
4. Reject extreme bright pixels.
5. Reject highlights.
6. Reject highly saturated non-skin outliers.
7. Remove statistical outliers.
8. Calculate median colour.
9. Calculate trimmed mean.
10. Calculate standard deviation.
11. Calculate colour variance.
12. Calculate usable-pixel percentage.

Do not rely only on fixed RGB skin thresholds. Use landmarks and robust statistics as the primary constraints.

---

# 15. Colour Science

Calculate and store where appropriate:

- Mean RGB.
- Median RGB.
- Trimmed-mean RGB.
- HEX.
- HSV or HSL.
- CIE XYZ.
- CIE Lab.
- L-star.
- a-star.
- b-star.
- Chroma.
- Hue angle.
- ROI variance.
- Difference between left and right cheeks.
- Difference between cheeks and forehead.

Perform correct sRGB linearisation before XYZ conversion.

Use D65 as the default reference white.

Create isolated and fully tested colour-conversion utilities.

Do not use browser CSS conversion for the core classifier.

---

# 16. Undertone Classification

User-facing classes:

- Warm.
- Cool.

Internal classes:

- Warm.
- Cool.
- Neutral.
- Uncertain.

Use configurable signals such as:

- Average CIE Lab b-star.
- Average CIE Lab a-star.
- Skin hue angle.
- Chroma.
- Forehead and cheek agreement.
- Left and right cheek agreement.
- Environmental colour-cast score.
- Image-quality score.
- Optional questionnaire signals.

Store thresholds and weights in a versioned configuration file, for example:

```text
packages/colour-engine/config/classifier-v1.json
```

Expected result shape:

```json
{
  "undertone": "warm",
  "internalUndertone": "warm",
  "score": 0.72,
  "confidence": 0.81,
  "confidenceLabel": "high",
  "evidence": [
    "The extracted skin hue was positioned toward the warmer range.",
    "The forehead and cheek regions produced consistent colour values."
  ],
  "warnings": [],
  "classifierVersion": "1.0.0"
}
```

The classifier MUST be:

- Deterministic.
- Explainable.
- Documented.
- Configurable.
- Versioned.
- Testable.

---

# 17. Seasonal Colour Classification

Support four major seasons:

## Spring

Typical signals:

- Warm.
- Light or medium value.
- Clearer or brighter chroma.
- Low-to-medium depth.

## Summer

Typical signals:

- Cool.
- Light or medium value.
- Muted or soft chroma.
- Low-to-medium contrast.

## Autumn

Typical signals:

- Warm.
- Medium or deep value.
- Muted or earthy direction.
- Medium contrast.

## Winter

Typical signals:

- Cool.
- Medium or deep value.
- Clear chroma.
- Higher contrast.

Use four feature dimensions:

1. Temperature: warm or cool.
2. Value: light, medium, or deep.
3. Chroma: muted, balanced, or clear.
4. Contrast: low, medium, or high.

Use skin features as the primary input.

Add an optional questionnaire for:

- Natural hair colour.
- Natural eye colour.
- Perceived natural contrast.
- Gold or silver jewellery preference.
- Tendency to burn or tan, labelled as optional and non-medical.

Treat questionnaire answers only as supporting signals.

Do not infer hair or eye colour confidently unless image quality and region reliability support it.

---

# 18. Sub-Season Classification

Support:

### Spring

- Light Spring.
- Warm Spring.
- Bright Spring.

### Summer

- Light Summer.
- Cool Summer.
- Soft Summer.

### Autumn

- Soft Autumn.
- Warm Autumn.
- Deep Autumn.

### Winter

- Deep Winter.
- Cool Winter.
- Bright Winter.

Only display a sub-season when confidence exceeds a configurable threshold.

Otherwise display the major season only.

Example result:

```json
{
  "season": "autumn",
  "subSeason": "deep-autumn",
  "confidence": 0.78,
  "confidenceLabel": "medium",
  "dimensions": {
    "temperature": 0.74,
    "value": 0.68,
    "chroma": 0.42,
    "contrast": 0.71
  },
  "classifierVersion": "1.0.0"
}
```

---

# 19. Confidence System

Classification score and confidence score MUST be separate.

Confidence factors may include:

- Image-quality score.
- Landmark-detection confidence.
- Face-pose quality.
- Usable skin-pixel percentage.
- ROI colour consistency.
- Left-right cheek agreement.
- Forehead-cheek agreement.
- Environmental colour cast.
- Margin between the top two classification scores.
- Questionnaire agreement.

Return numeric confidence from 0 to 1.

Default labels:

- High: 0.80–1.00.
- Medium: 0.60–0.79.
- Low: below 0.60.

Keep thresholds configurable.

For low-confidence results:

- Show a warning.
- Explain the likely cause.
- Recommend another image.
- Do not hide uncertainty.

---

# 20. Explainability

Every analysis result MUST explain:

- Estimated undertone.
- Suggested major season.
- Suggested sub-season.
- Confidence.
- Why the result was selected.
- Which image-quality factors affected it.
- Which colours are recommended.
- Which colours may be less harmonious.
- How to improve a future scan.

Create a collapsed technical-details panel containing:

- Sampled RGB.
- HEX.
- CIE Lab.
- Chroma.
- Hue angle.
- ROI consistency.
- Quality metrics.
- Classification dimensions.
- Classifier version.
- Processing duration.

Do not expose raw numbers without readable explanations.

---

# 21. Personal Fashion Palettes

Seed curated palettes for every major season and sub-season.

Each colour record should include:

- Name.
- HEX.
- RGB.
- CIE Lab.
- Colour family.
- Recommended use.
- Priority.
- Major season.
- Sub-season.
- Active status.

Palette groups:

- Neutrals.
- Core colours.
- Accent colours.
- Formal wear.
- Casual wear.
- Accessories.
- Hijab or headwear.
- Colours to use cautiously.

Avoid absolute language such as “forbidden”.

Use wording such as:

- Less harmonious.
- May reduce facial contrast.
- Consider wearing away from the face.
- Can be balanced using accessories or makeup.

Users should be able to:

- View swatches.
- Read colour names.
- Copy HEX values.
- Filter palette groups.
- Save favourite colours.
- Print or download a simple palette card.
- Share a non-sensitive result summary.

Do not include the source face image in shared results by default.

---

# 22. Cosmetic Recommendations

Provide recommendations for:

- Lipstick.
- Blusher.
- Eyeshadow.
- Eyeliner.
- Highlighter.
- General foundation undertone direction.

Each recommendation should include:

- Name.
- HEX swatch.
- Product type.
- Intensity.
- Day or evening use.
- Major season.
- Sub-season.
- Usage note.

Do not recommend a precise commercial foundation shade based only on the image.

Limit foundation guidance to general undertone direction:

- Warm.
- Cool.
- Neutral.
- Olive only if technically supported and documented.

Do not make medical or skin-safety claims.

---

# 23. Product and E-Commerce Recommendation Module

Implement a product directory and recommendation system.

Support:

- Manually managed products.
- CSV imports.
- External product links.
- Store management.
- Product-colour data.
- Seasonal tags.
- Product favourites.
- Filters.

Do not depend on unofficial scraping.

Product fields:

- Product name.
- Brand.
- Store.
- Category.
- Gender or unisex.
- Description.
- Image URL.
- External product URL.
- Current price.
- Original price.
- Currency.
- Availability.
- Colour name.
- Colour HEX.
- Colour CIE Lab.
- Major-season tags.
- Sub-season tags.
- Active status.
- Last-updated timestamp.

Categories:

- Tops.
- Shirts.
- Dresses.
- Outerwear.
- Trousers.
- Skirts.
- Scarves.
- Hijabs.
- Accessories.
- Shoes.
- Bags.
- Cosmetics.

## 23.1 Colour matching

Convert product colours to CIE Lab.

Use CIEDE2000 or another defensible, documented colour-difference algorithm.

Calculate:

- Minimum distance to a recommended palette colour.
- Palette match score.
- Major-season tag match.
- Sub-season tag match.
- Category relevance.
- Availability.
- User-filter relevance.

Document the ranking formula.

State that product photography may not represent exact real-world colour.

## 23.2 External links

External product links MUST:

- Permit only HTTP or HTTPS.
- Reject `javascript:` URLs.
- Open in a new tab.
- Use `noopener` and `noreferrer`.
- Show the destination store.
- Explain that purchasing occurs externally.

Do not scrape Shopee, Lazada, Zalora, or another marketplace without an authorised API.

Seed realistic demonstration products and label them clearly as demo data.

---

# 24. Database Design

Create SQL migrations for the following conceptual tables. Names may be improved where technically justified.

## 24.1 Users

- `profiles`
- `user_preferences`
- `user_consents`

## 24.2 Analyses

- `analyses`
- `analysis_quality_metrics`
- `analysis_colour_samples`
- `analysis_classifications`
- `analysis_images`
- `algorithm_versions`

## 24.3 Palettes

- `colour_seasons`
- `colour_subseasons`
- `palette_colours`
- `cosmetic_recommendations`
- `user_favourite_colours`

## 24.4 Commerce

- `stores`
- `products`
- `product_colours`
- `product_season_tags`
- `user_favourite_products`
- `product_import_jobs`
- `product_import_errors`

## 24.5 Administration

- `admin_audit_logs`
- `content_pages`
- `system_settings`

Use:

- UUID primary keys.
- Foreign keys.
- Indexes.
- Unique constraints.
- Check constraints.
- `created_at`.
- `updated_at`.
- Automatic updated-at triggers.
- Soft deletion only where justified.

Create a Mermaid ERD.

---

# 25. Row Level Security

Enable RLS for every appropriate table.

Required behaviour:

- Users can read only their own analyses.
- Users can update only their own profile and preferences.
- Users can delete only their own records.
- Public users can read active public palette data.
- Public users can read active products and stores.
- Only administrators can mutate administrative content.
- Private images are accessible only to their owner.
- Service-role credentials never reach the browser.
- Admin checks are enforced server-side, not only in UI code.

Document every RLS policy.

Create verification scripts or tests proving:

- User A cannot read User B’s analysis.
- User A cannot delete User B’s analysis.
- A normal user cannot access admin mutations.
- Anonymous users cannot access private records.
- Public content remains readable.

---

# 26. API Design

Create a versioned API under:

```text
/api/v1
```

## 26.1 Health

- `GET /api/v1/health`
- `GET /api/v1/readiness`

## 26.2 Analysis

- `POST /api/v1/analyses/preview-quality`
- `POST /api/v1/analyses`
- `GET /api/v1/analyses`
- `GET /api/v1/analyses/{analysis_id}`
- `DELETE /api/v1/analyses/{analysis_id}`
- `POST /api/v1/analyses/{analysis_id}/save-image`
- `DELETE /api/v1/analyses/{analysis_id}/image`

## 26.3 Palettes

- `GET /api/v1/seasons`
- `GET /api/v1/seasons/{season_slug}`
- `GET /api/v1/analyses/{analysis_id}/palette`

## 26.4 Products

- `GET /api/v1/products`
- `GET /api/v1/products/{product_id}`
- `GET /api/v1/analyses/{analysis_id}/recommended-products`
- `POST /api/v1/products/{product_id}/favourite`
- `DELETE /api/v1/products/{product_id}/favourite`

## 26.5 Admin

Create CRUD endpoints for:

- Seasons.
- Sub-seasons.
- Palettes.
- Cosmetics.
- Stores.
- Products.
- Product imports.
- System settings.

API requirements:

- Pydantic request and response models.
- Consistent response structures.
- Pagination.
- Filtering.
- Sorting.
- JWT authentication.
- Role-based authorisation.
- Request IDs.
- Generated OpenAPI documentation.
- Correct HTTP status codes.
- Structured errors.
- No raw server exceptions returned to clients.
- No facial-image content in logs.

Example error:

```json
{
  "error": {
    "code": "IMAGE_TOO_DARK",
    "message": "The image is too dark for a reliable colour analysis.",
    "details": {
      "brightnessScore": 0.31
    },
    "requestId": "generated-request-id"
  }
}
```

---

# 27. Frontend State and API Handling

Use TanStack Query for server state.

Implement:

- Centralised API client.
- Typed contracts.
- Authentication-token attachment.
- Session-expiration handling.
- Query invalidation.
- Loading states.
- Empty states.
- Error states.
- Safe retry rules.
- Request cancellation.
- Duplicate-submission prevention.

Do not store sensitive image data in localStorage.

Use object URLs for temporary image previews and revoke them properly.

---

# 28. Results Experience

The result page MUST show:

1. Image-quality score.
2. Estimated undertone.
3. Suggested major season.
4. Suggested sub-season when available.
5. Numeric confidence.
6. Confidence label.
7. Plain-language explanation.
8. Fashion palette.
9. Cosmetic palette.
10. Less harmonious colours.
11. Product matches.
12. Retake action.
13. Save action.
14. Privacy notice.
15. Disclaimer.

Organise into tabs or sections:

- Overview.
- Fashion.
- Cosmetics.
- Product Matches.
- Technical Details.

Technical Details MUST be collapsed by default.

---

# 29. Administrator Portal

Implement:

- Admin dashboard.
- Season CRUD.
- Sub-season CRUD.
- Palette CRUD.
- Cosmetic recommendation CRUD.
- Store CRUD.
- Product CRUD.
- Product activation/deactivation.
- CSV import.
- Import preview.
- Row-level validation.
- Import history.
- Row-level error reporting.
- Audit logs.
- Algorithm-version display.
- Anonymised statistics.
- System-health summary.

Do not expose private user images in general admin screens.

Record important administrative changes in audit logs.

---

# 30. CSV Product Import

Expected columns:

```text
product_name
brand
store_slug
category
gender
description
image_url
product_url
price
original_price
currency
availability
colour_name
colour_hex
season_tags
subseason_tags
active
```

Requirements:

- File validation.
- Dry-run mode.
- Preview before import.
- Row-level validation.
- Row-level errors.
- Duplicate detection.
- Database transactions.
- Import history.
- Downloadable error report.
- Sample CSV file.

---

# 31. Accessibility

Target WCAG 2.1 AA where practical.

Implement:

- Keyboard navigation.
- Visible focus indicators.
- Semantic HTML.
- Correct heading hierarchy.
- Accessible form labels.
- Accessible validation messages.
- Accessible dialogs.
- Accessible camera controls.
- Meaningful alt text.
- Reduced-motion support.
- Adequate contrast.
- Status communication that does not depend only on colour.
- Palette swatches with names and HEX labels.

Run automated accessibility checks on important pages.

---

# 32. Responsive Design

Use mobile-first design.

Test at:

- 375 px.
- 390 px.
- 768 px.
- 1024 px.
- 1440 px.

Ensure:

- Camera flow works on mobile.
- No unintended horizontal overflow.
- Forms remain readable.
- Tables adapt or scroll safely.
- Buttons have appropriate touch targets.
- Palette grids remain usable.
- Admin pages work on tablet and desktop.

---

# 33. Security Requirements

Implement:

- Strict input validation.
- Real image decoding.
- File-size limits.
- MIME verification.
- Protection against decompression bombs.
- Temporary-file cleanup.
- JWT verification.
- Role-based authorisation.
- Secure CORS.
- Rate limiting.
- Safe external-URL validation.
- Parameterised queries.
- Security headers.
- Secret validation.
- No secrets in client bundles.
- Safe error messages.
- Dependency vulnerability review.
- Audit logging.
- Account deletion.
- Private storage.
- Signed image URLs.
- Server-side admin checks.

Create a threat model covering:

- Malicious image uploads.
- Oversized files.
- Corrupted images.
- Unauthorised data access.
- Storage exposure.
- Admin-route bypass.
- External URL injection.
- API abuse.
- Token leakage.
- Sensitive logging.
- Account-deletion failures.

Do not implement custom cryptography.

---

# 34. Logging and Observability

Use structured backend logging.

Include:

- Timestamp.
- Log level.
- Request ID.
- Endpoint.
- Response status.
- Processing duration.
- Pipeline-stage durations.
- Error code.

Never log:

- Passwords.
- Access tokens.
- Image bytes.
- Private signed URLs.
- Supabase service keys.
- Sensitive profile data.

Add anonymised metrics where practical:

- Number of analyses.
- Successful-analysis rate.
- Quality-rejection rate.
- Average processing duration.
- Confidence distribution.
- Common error categories.

---

# 35. Performance

Implement:

- Safe client-side image reduction.
- Backend resize protection.
- Lazy loading.
- Public palette caching.
- Product pagination.
- Request cancellation.
- Efficient masks.
- Efficient NumPy operations.
- Database indexes.
- Query optimisation.
- Pipeline-stage timing.

Do not optimise blindly. Measure before and after meaningful changes.

---

# 36. Testing Requirements

Testing is mandatory.

## 36.1 Backend unit tests

Test:

- Image validation.
- MIME validation.
- Decode failures.
- EXIF orientation.
- Image resizing.
- Blur metric.
- Exposure metric.
- Face-count logic.
- Pose logic.
- ROI generation.
- Pixel filtering.
- RGB conversion.
- RGB-to-XYZ conversion.
- XYZ-to-Lab conversion.
- Chroma.
- Hue angle.
- Undertone scoring.
- Major-season scoring.
- Sub-season scoring.
- Confidence.
- CIEDE2000.
- Product ranking.
- Error mapping.

## 36.2 Backend integration tests

Test:

- Health.
- Readiness.
- Invalid upload.
- Oversized upload.
- Unsupported format.
- No face.
- Multiple faces.
- Dark image.
- Blurred image.
- Successful analysis.
- Authentication.
- Record ownership.
- Admin authorisation.
- Product filters.
- Product favourites.
- Analysis deletion.

## 36.3 Frontend unit tests

Test:

- Consent form.
- Upload component.
- Camera permission.
- Camera unavailable.
- Image preview.
- Analysis wizard.
- Quality warning.
- Processing state.
- Result card.
- Confidence display.
- Palette swatch.
- Product filters.
- Auth guards.
- Admin guards.

## 36.4 End-to-end tests

Use Playwright for:

1. Guest completes temporary analysis.
2. Registered user creates an account.
3. Registered user completes and saves an analysis.
4. User opens analysis history.
5. User deletes an analysis.
6. User views product recommendations.
7. User favourites a product.
8. Admin creates or edits a product.
9. Non-admin cannot access admin.
10. Camera denial falls back to upload.

## 36.5 Test assets

Use properly licensed, consented, or synthetic test images.

Include or document fixtures for:

- Valid front-facing face.
- No face.
- Multiple faces.
- Dark image.
- Bright image.
- Blurred image.
- Strong yellow cast.
- Strong blue cast.
- Diverse skin-tone ranges.

Do not scrape private personal images.

Document licences and origins.

---

# 37. Fairness and Evaluation

Evaluate the pipeline across diverse skin-tone ranges.

Do not optimise only for light skin.

Document:

- Dataset source.
- Licence or consent.
- Number of images.
- Lighting conditions.
- Skin-tone representation.
- Successful cases.
- Failure cases.
- Known limitations.

Measure where possible:

- Face-detection success rate.
- Image-quality rejection rate.
- ROI extraction success rate.
- Repeated-image consistency.
- Label agreement where credible labels exist.
- Confidence behaviour.
- Processing duration.

Do not invent statistics.

If professionally labelled personal-colour data is unavailable, describe evaluation as technical consistency testing rather than true classification accuracy.

---

# 38. Environment Variables

Create complete `.env.example` files.

Frontend:

```dotenv
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Backend:

```dotenv
APP_ENV=
APP_NAME=
APP_VERSION=
API_HOST=
API_PORT=
FRONTEND_URL=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=
DATABASE_URL=
MAX_IMAGE_SIZE_MB=
IMAGE_STORAGE_ENABLED=
RATE_LIMIT=
LOG_LEVEL=
```

Never expose:

- Service-role key.
- Database password.
- JWT secret.

Validate required environment variables at startup and provide clear errors.

---

# 39. Local Development

Provide clear setup commands.

Expected root commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Docker:

```bash
docker compose up --build
```

Document:

- Prerequisites.
- Node version.
- Python version.
- pnpm version.
- uv installation.
- Supabase setup.
- Environment configuration.
- Database migrations.
- Seed process.
- Frontend startup.
- Backend startup.
- Test execution.

---

# 40. Docker

Create a production-ready backend Dockerfile.

Requirements:

- Minimal supported Python base image.
- Dependency caching.
- Non-root user.
- Only required system packages.
- No credentials copied into the image.
- Production ASGI server.
- Health-check support where appropriate.
- Reasonable image size.

Create Docker Compose for local development where useful.

---

# 41. CI/CD

Create GitHub Actions workflows.

Frontend checks:

- Install dependencies.
- Formatting.
- ESLint.
- TypeScript.
- Unit tests.
- Production build.

Backend checks:

- Install dependencies.
- Ruff.
- Static typing.
- pytest.
- Docker build.

Optional separate workflows:

- Playwright.
- Dependency audit.
- Accessibility checks.
- Deployment smoke tests.

Do not expose production secrets in logs.

Do not configure an automatic production deployment without documenting its behaviour and required secrets.

---

# 42. Production Deployment

Prepare deployment for Supabase, Render, and Vercel.

## 42.1 Supabase

Document and prepare:

1. Create project.
2. Configure authentication.
3. Configure site URL.
4. Configure redirect URLs.
5. Run migrations.
6. Run seed scripts.
7. Create private image bucket.
8. Apply RLS policies.
9. Apply storage policies.
10. Configure administrator role.
11. Verify user isolation.
12. Obtain required environment variables.

## 42.2 Render backend

Create:

- Production Dockerfile.
- `render.yaml` where useful.
- Build configuration.
- Start command.
- Health path.
- Required environment-variable list.
- CORS configuration.
- Logging instructions.
- Memory and CPU notes for OpenCV/MediaPipe.
- Cold-start expectations.
- Smoke-test commands.

## 42.3 Vercel frontend

Document:

1. Import GitHub repository.
2. Select the correct frontend root directory.
3. Configure pnpm.
4. Add public environment variables.
5. Configure backend API URL.
6. Configure Supabase values.
7. Configure authentication redirect URLs.
8. Create preview deployment.
9. Run smoke tests.
10. Promote to production.

## 42.4 Production validation

Verify:

- Landing page.
- Registration.
- Email verification.
- Login.
- Password reset.
- Camera on HTTPS.
- Upload.
- Quality validation.
- Analysis.
- Result page.
- Saved analysis.
- Analysis history.
- Product recommendations.
- External product links.
- Admin protection.
- RLS isolation.
- Image deletion.
- Analysis deletion.
- Account deletion.
- Mobile responsiveness.
- Backend health.
- No sensitive information in logs.

Do not claim deployment is complete until deployed URLs have been smoke-tested.

If credentials are unavailable, fully prepare deployment configuration and provide a precise manual-action checklist.

---

# 43. Documentation Deliverables

Create a comprehensive root `README.md` containing:

- Project overview.
- Features.
- Screenshot placeholders.
- Architecture.
- Technology stack.
- Prerequisites.
- Installation.
- Environment variables.
- Supabase setup.
- Database migrations.
- Seed instructions.
- Development commands.
- Testing.
- Docker.
- Deployment.
- Privacy.
- Security.
- Limitations.
- Future work.

Create:

```text
docs/
├── architecture.md
├── database-schema.md
├── api-reference.md
├── colour-analysis-methodology.md
├── classifier-configuration.md
├── privacy-and-consent.md
├── security-review.md
├── threat-model.md
├── testing-report.md
├── deployment-guide.md
├── user-manual.md
├── administrator-manual.md
├── demo-script.md
├── fyp-methodology-summary.md
├── evaluation-template.md
└── future-work.md
```

Create valid Mermaid diagrams for:

- System architecture.
- User analysis flow.
- Database ERD.
- Image-processing pipeline.
- Authentication flow.
- Deployment architecture.

Verify Mermaid syntax.

---

# 44. FYP Documentation

Prepare academic-ready material.

## 44.1 Problem statement

Explain the difficulty users face when selecting suitable colours and the subjectivity of manual colour analysis.

## 44.2 Objectives

Define measurable objectives for:

- Facial-image acquisition.
- Image-quality validation.
- Skin-region detection.
- Colour-feature extraction.
- Undertone estimation.
- Seasonal classification.
- Personal palette generation.
- Product matching.
- Result storage.

## 44.3 Scope

Clearly state:

- Included features.
- Excluded features.
- Assumptions.
- Limitations.

## 44.4 Methodology

Explain:

- Image preprocessing.
- Facial landmarks.
- Region selection.
- Pixel filtering.
- Colour-space conversion.
- Classification logic.
- Confidence calculation.
- Product matching.
- Testing methodology.

## 44.5 Evaluation

Prepare templates for:

- Functional test cases.
- Usability testing.
- Participant feedback.
- Classification consistency.
- Performance measurements.
- Failure cases.
- Limitations.

## 44.6 Future work

Include:

- Physical calibration card.
- Improved white-balance calibration.
- Larger labelled datasets.
- Professionally validated season labels.
- Real retailer APIs.
- Native mobile application.
- Machine-learning comparison.
- Improved fairness evaluation.
- Personal stylist consultation.

---

# 45. Demonstration Mode

Prepare a stable FYP demonstration mode.

Include:

- Seeded demo account instructions.
- Seeded administrator setup instructions.
- Seeded palettes.
- Seeded cosmetics.
- Seeded stores.
- Seeded products.
- Documented demo images.
- Predictable flow.
- No fake live-commerce claims.

Create a demo script covering:

1. Landing page.
2. Registration or login.
3. Consent.
4. Camera or upload.
5. Failed-quality example.
6. Valid-image example.
7. Undertone result.
8. Seasonal result.
9. Fashion palette.
10. Cosmetic palette.
11. Product recommendations.
12. Saving the result.
13. Analysis history.
14. Admin product management.
15. Privacy deletion.

---

# 46. Implementation Phases

## Phase 0 — Audit and planning

- Inspect repository.
- Record existing state.
- Create planning files.
- Confirm architecture.
- Record assumptions.
- Record risks.

## Phase 1 — Foundation

- Initialise monorepo.
- Configure Next.js.
- Configure FastAPI.
- Configure shared packages.
- Configure TypeScript.
- Configure Python tooling.
- Configure linting and formatting.
- Configure Docker.
- Create environment examples.

## Phase 2 — Database and authentication

- Create schema.
- Create migrations.
- Configure Supabase Auth.
- Create profiles.
- Enable RLS.
- Create storage policies.
- Create role guards.
- Seed seasons and palettes.

## Phase 3 — UI foundation

- Global layout.
- Navigation.
- Landing page.
- Authentication pages.
- Dashboard shell.
- Design system.
- Responsive components.
- Accessibility baseline.

## Phase 4 — Image acquisition

- Consent.
- Camera.
- Camera fallback.
- Upload.
- Preview.
- Client validation.
- Photography instructions.

## Phase 5 — Image quality

- File validation.
- Face detection.
- Face-count validation.
- Face-size validation.
- Pose validation.
- Blur detection.
- Exposure checks.
- Lighting checks.
- Colour-cast checks.
- Quality API.
- Quality UI.

## Phase 6 — Colour engine

- Facial landmarks.
- Skin ROIs.
- Pixel filtering.
- Colour aggregation.
- RGB.
- HEX.
- HSV/HSL.
- XYZ.
- Lab.
- Undertone.
- Major season.
- Sub-season.
- Confidence.
- Explainability.

## Phase 7 — Results and persistence

- Analysis API.
- Results page.
- Save result.
- History.
- Delete result.
- Privacy settings.
- Optional image storage.

## Phase 8 — Palettes and cosmetics

- Palette data.
- Palette API.
- Palette UI.
- Cosmetic data.
- Cosmetic UI.
- Favourite colours.
- Printable palette card.

## Phase 9 — Products

- Stores.
- Products.
- Product colours.
- CIEDE2000.
- Product ranking.
- Filters.
- Recommendations.
- External-link safety.
- Favourites.
- CSV imports.

## Phase 10 — Administration

- Admin dashboard.
- CRUD interfaces.
- CSV import screens.
- Import history.
- Audit logs.
- Algorithm versions.
- System settings.

## Phase 11 — Testing and hardening

- Unit tests.
- Integration tests.
- End-to-end tests.
- Accessibility checks.
- Security review.
- Privacy review.
- Performance review.
- Responsive checks.
- Browser checks.

## Phase 12 — Deployment

- Supabase production preparation.
- Render backend preparation and deployment.
- Vercel frontend preparation and deployment.
- Production environment variables.
- CORS.
- Auth redirects.
- Smoke testing.

## Phase 13 — Documentation and handover

- README.
- Architecture documents.
- API documentation.
- User manual.
- Admin manual.
- Testing report.
- FYP methodology.
- Demo script.
- Known limitations.
- Final project status.

---

# 47. MVP Priority

If time becomes constrained, preserve these first:

1. Responsive interface.
2. Camera and upload.
3. Consent.
4. Exactly-one-face detection.
5. Image-quality validation.
6. Forehead and cheek extraction.
7. RGB and CIE Lab extraction.
8. Warm/cool undertone.
9. Four major seasons.
10. Fashion palettes.
11. Cosmetic palettes.
12. Authentication.
13. Saved analyses.
14. Product directory.
15. External links.
16. Privacy deletion.
17. Tests.
18. Deployment.
19. Documentation.

Lower-priority enhancements:

- Real-time video analysis.
- Automatic eye-colour detection.
- Automatic hair-colour detection.
- Live retailer APIs.
- Social sharing.
- Native mobile app.
- Advanced analytics.
- Sophisticated PDF design.

---

# 48. Definition of Done

The project is complete only when:

- The repository can be installed using the README.
- Frontend runs locally.
- Backend runs locally.
- Database migrations succeed.
- Seed data loads.
- Authentication works.
- Guest analysis works.
- Registered-user analysis works.
- Camera flow works.
- Upload flow works.
- Exactly-one-face validation works.
- Poor-quality images receive clear feedback.
- Skin regions are extracted.
- Colour values are calculated.
- Undertone is estimated.
- Major season is returned.
- Sub-season behaviour follows confidence rules.
- Confidence is displayed.
- Fashion palette is displayed.
- Cosmetic palette is displayed.
- Products are recommended.
- Analyses can be saved.
- Analyses can be deleted.
- Images can be deleted.
- Account data can be deleted.
- Admin pages are protected.
- RLS is verified.
- Tests pass.
- Builds pass.
- Docker image builds.
- CI passes.
- Frontend is deployed or fully ready for owner credentials.
- Backend is deployed or fully ready for owner credentials.
- Supabase is configured or fully documented for owner setup.
- Production smoke tests pass when deployment access is available.
- No secrets are committed.
- No critical placeholder screens remain.
- No known critical security issue remains.
- Documentation is complete.
- All completed work is pushed to GitHub.

---

# 49. Code-Quality Rules

Follow these rules:

- Use strict typing.
- Avoid unnecessary `any`.
- Keep functions focused.
- Separate routes from business logic.
- Separate UI from classification logic.
- Avoid duplicated logic.
- Avoid unexplained magic numbers.
- Use versioned algorithm configuration.
- Handle expected errors explicitly.
- Validate all external input.
- Do not suppress type errors without a documented reason.
- Do not add fake successful API responses.
- Do not mock the final production classifier.
- Do not commit secrets.
- Do not store facial images unnecessarily.
- Do not claim unmeasured accuracy.
- Do not leave production-critical TODOs.
- Write meaningful tests.
- Keep documentation aligned with actual code.

---

# 50. Review Protocol

Before declaring completion, perform:

## 50.1 Architecture review

Check:

- Separation of concerns.
- Dependency direction.
- Maintainability.
- Scalability.
- Deployment feasibility.

## 50.2 Computer-vision review

Check:

- Landmark reliability.
- ROI placement.
- Lighting sensitivity.
- Skin-tone diversity.
- Threshold configuration.
- Confidence behaviour.
- Failure handling.

## 50.3 Database review

Check:

- Schema consistency.
- Foreign keys.
- Indexes.
- Constraints.
- RLS.
- Storage policies.
- User isolation.

## 50.4 Security review

Check:

- Authentication.
- Authorisation.
- Upload validation.
- Private storage.
- Secret management.
- External URLs.
- Logging.
- Rate limiting.

## 50.5 QA review

Check:

- Core requirements.
- Error states.
- Mobile behaviour.
- Accessibility.
- Browser compatibility.
- Test coverage.
- Production smoke tests.

## 50.6 Documentation review

Check:

- Installation accuracy.
- Command accuracy.
- Environment variables.
- API documentation.
- Architecture diagrams.
- Deployment instructions.
- FYP methodology.
- Limitations.

Fix all critical and high-priority findings.

---

# 51. Handling Uncertain Algorithmic Areas

When an algorithmic decision is uncertain:

1. Review official library documentation and credible technical or academic references.
2. Document the selected method.
3. Implement the simplest defensible baseline.
4. Store thresholds in configuration.
5. Add tests.
6. Record limitations.
7. Do not hide uncertainty.
8. Do not pretend a heuristic is a trained model.

If an ML model is later added:

- Document the dataset.
- Document licensing and consent.
- Document train/validation/test split.
- Prevent leakage.
- Preserve reproducible training code.
- Save model metadata.
- Evaluate fairness.
- Compare against the rule-based baseline.
- Keep the rule-based baseline usable until the model demonstrably performs better.

---

# 52. Mandatory Verification After Every Phase

After every major phase:

1. Run formatting.
2. Run linting.
3. Run type checking.
4. Run relevant unit tests.
5. Run integration tests where applicable.
6. Run production build for affected applications.
7. Fix failures.
8. Update documentation.
9. Update `PROJECT_STATUS.md`.
10. Commit logical changes.
11. Push the branch to GitHub.
12. Record the branch, commit, tests, and build result.

Do not state that a feature is complete unless it has been implemented and verified.

---

# 53. First Response Format

Your first response after reading this document MUST contain:

1. Repository audit summary.
2. Existing project state.
3. Assumptions.
4. Proposed architecture.
5. Implementation phases.
6. Main technical risks.
7. Privacy and security risks.
8. Immediate next actions.
9. Genuine blockers only.

After giving the summary:

- Create the planning documents.
- Start Phase 0.
- Continue immediately into Phase 1.
- Do not stop after producing only a plan.
- Do not wait for confirmation unless a genuine blocker exists.

---

# 54. End-of-Session Report

At the end of every working session, report:

- Work completed.
- Files created.
- Files modified.
- Commands executed.
- Tests executed.
- Test results.
- Build results.
- Current blockers.
- Current phase.
- Next phase.
- Updated completion percentage.
- Current Git branch.
- Latest commit hash.
- Latest commit message.
- Branches created.
- Branches pushed.
- Pull requests created or prepared.
- Whether the local branch is synchronised with GitHub.

---

# 55. Sub-Agent Usage

Use specialised sub-agents when available for:

- Architecture.
- Frontend.
- Backend.
- Computer vision.
- Database and RLS.
- Security.
- Testing.
- Documentation.

However:

- Maintain one authoritative project plan.
- Prevent conflicting edits.
- Review every sub-agent result.
- Run tests after integration.
- Do not accept unverified claims.
- Keep all modules consistent.

---

# 56. Final Execution Command

Begin now.

Clone or connect to:

```text
https://github.com/MuhdAqmarr/Smart-Personal-Colour-Analysis-System.git
```

Then:

1. Inspect the repository.
2. Verify Git remote and current branch.
3. Verify GitHub authentication.
4. Create the planning and status documents.
5. Complete Phase 0.
6. Continue immediately into Phase 1.
7. Initialise the complete project safely if the repository is empty.
8. Run validation before the first commit.
9. Create the initial commit.
10. Push the initial work to GitHub.
11. Continue development through structured branches.
12. Push every completed and verified major phase.
13. Keep `main` stable and deployable.
14. Continue until the Definition of Done is reached or a genuine external blocker requires owner action.

Suggested initial commit:

```text
chore: initialise Smart Personal Colour Analysis System
```

Do not stop after generating only a plan.

Do not leave completed work only in the local environment.

Do not declare the project complete until the verified implementation, migrations, tests, documentation, deployment configuration, and CI workflows have been pushed to the GitHub repository.
