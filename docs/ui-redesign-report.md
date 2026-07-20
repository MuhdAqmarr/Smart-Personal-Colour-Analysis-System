# UI Redesign Report — Modern Glass Direction

Branch `feat/modern-glass-ui-redesign`, built against
`COLOURSENSE_MODERN_UI_REDESIGN_PROMPT.md`. Companion documents:
`docs/ui-redesign-audit.md` (before-state), `docs/ui-redesign-plan.md`
(execution plan), `docs/design-system.md` (the resulting system).

## Problems in the previous design

From the audit of `main` @ `353bac8`:

1. Decorative serif (Fraunces) on every heading in 38 files — the main
   source of the dated, editorial feel.
2. Terracotta/warm-porcelain token system pushed a beauty-salon palette
   into every control, including admin tables.
3. A latent circular `--font-sans` reference meant body text silently
   fell back to the platform serif.
4. Dark mode was dead code: full token set, `next-themes` installed,
   but no provider and no toggle.
5. Uniform depth — every card identical (`ring + shadow-xs`), giving
   marketing pages, dashboard, and admin the same template weight.
6. Repeated icon-in-tinted-square motif and alternating striped
   sections on all public pages.
7. No surface hierarchy, elevation scale, motion language, glass
   materials, or seasonal accent tokens.
8. Small controls (h-8 inputs/buttons) at odds with airy layouts and
   touch targets.

## Main redesign decisions

- **Typography:** Geist only, `clamp()` display scale, weights 400–650,
  eyebrows instead of badge-chips for section labels.
- **Colour:** cool off-white/graphite neutral system in OKLCH; primary
  action = graphite (light) / soft white (dark); blue-lilac reserved as
  the single accent; terracotta demoted to palette *data*.
- **Seasonal language:** four muted season tokens drive radial washes
  on the result hero, season tiles/panels, latest-result card, and
  admin distribution bars — never full-strength on chrome.
- **Materials:** six glass classes with solid and
  reduced-transparency fallbacks; glass restricted to navigation,
  floating controls, modals/sheets, and the result surface. Dense
  content stays solid.
- **Structure:** shared `PageHeader`/`SectionHeading`/`PageContainer`
  patterns; Card gains six density-driven variants; buttons/inputs grow
  to h-9/h-10 with a lg h-11 tier.
- **Dark mode:** designed, not inverted — charcoal canvas, translucent
  elevated surfaces, inverted primary, brightened seasonal accents,
  wired via next-themes with a header toggle.

## Pages changed

Every route: landing, how-it-works, seasons, products, FAQ,
privacy/terms/disclaimer, all four auth screens, the six-step analysis
wizard (consent, guidance, capture/camera/upload, preview, processing,
results), dashboard, history list + detail, favourites, settings +
privacy, and all eight admin pages.

## Components changed

- Restyled primitives: button (new sizes + `glass` variant), card
  (variants), input, textarea, select, tabs, dialog, sheet, alert
  (success/warning/info tones), skeleton, badge usage.
- New design-system layer: glass-surface, page-container, page-header,
  section-heading, metric-card, empty-state, status-indicator,
  colour-chip, theme-toggle.
- Camera capture gained a native-style floating glass control bar with
  a round capture control; password fields gained an accessible
  show/hide toggle; dashboard gained a latest-result panel.
- Untouched by design: wizard state machine, StrictMode mutation guard,
  camera permission logic, API clients, contracts, and all backend
  code.

## Accessibility

- axe (WCAG 2.1 A/AA) serious/critical = 0 on landing, analysis
  consent, sign-in, seasons, FAQ — desktop and mobile projects.
- One redesign-introduced contrast issue (hero panel labels at 4.37:1
  under `opacity-80`) was caught by axe and fixed by removing container
  opacity.
- Focus rings moved to a dedicated `--ring` accent visible in both
  themes; reduced-motion collapse retained; new
  `prefers-reduced-transparency` fallback added for all glass.
- Password visibility toggle is labelled and `aria-pressed`; capture
  controls are labelled buttons.

## Performance considerations

- Blur limited to one layer per stacking context, radii ≤ 24px, no
  full-screen `backdrop-filter`; gradients are two-stop radials.
- No new dependencies (next-themes was already in package.json);
  no animation library — CSS transitions with three duration tokens.
- Fonts unchanged (`next/font`, one family removed: Fraunces), so the
  font payload shrank.
- Server components preserved; the only new client component of note
  is the dashboard latest-result card (one existing list query).

## Testing performed

- `pnpm --filter web lint` — clean (0 errors, 0 warnings).
- `pnpm --filter web typecheck` — clean.
- `pnpm --filter web test` — 24/24 RTL unit tests.
- `pnpm --filter web build` — production build succeeds.
- `pnpm --filter web test:e2e` — 30/30 Playwright specs (guest
  analysis flow, camera-denied fallback, public pages, admin/dashboard
  redirects, axe suite) against the full local stack.
- Viewport sweep: 9 widths (320→1728) × 9 routes — zero horizontal
  overflow.
- Screenshot review: baseline set (18 screens) captured before any
  change; after-state reviewed per phase in both themes, including
  mobile.

## Remaining limitations

- CSP still allows `unsafe-inline` styles/scripts (pre-existing Next.js
  constraint; unchanged by this redesign).
- Admin tables scroll horizontally rather than using sticky headers —
  sticky needs a fixed-height scroll container and was deliberately
  deferred.
- Visual-regression snapshots are not stored in CI; the e2e suite
  asserts behaviour and accessibility, while visual review remains a
  manual screenshot pass.
- `prefers-reduced-transparency` support depends on browser
  availability of the media query; unsupported browsers simply keep
  the (already readable) translucent surfaces.
