# UI Redesign Audit — Existing Frontend

Baseline commit: `353bac8` (main). Captured before any redesign work on
`feat/modern-glass-ui-redesign`. Baseline screenshots of all 18 major
routes (desktop 1280px, mobile 390px, public + authenticated + admin)
were taken against the running local stack and reviewed; they are kept
out of the repository by design.

## 1. Typography

- Fonts loaded in `app/layout.tsx` via `next/font`: **Geist** (body),
  **Geist Mono** (technical values), **Fraunces** (serif, variable axes
  `opsz/SOFT/WONK`) mapped to `--font-heading`.
- `font-heading` (Fraunces) is used in **38 component/page files** — every
  heading, card title, and the wordmark render in a decorative serif.
- Headings use `font-semibold` almost everywhere; body copy is 400.
- Scale is ad-hoc Tailwind steps (`text-3xl`/`text-4xl`/`text-5xl`);
  no `clamp()`-based responsive display sizes; no tracking control beyond
  `tracking-tight` on some headings.

**Verdict:** the serif-editorial direction is the single biggest source of
the "old-fashioned" feel. Removal is a token-level change (re-point
`--font-heading`) plus per-page weight/tracking tuning.

## 2. Colour tokens

`globals.css` defines a shadcn-style token set in OKLCH:

- Light: warm porcelain background `oklch(0.988 0.004 84)`, terracotta
  primary `oklch(0.545 0.118 42)`, warm beige secondary/muted/accent
  (hues 45–84 — everything sits in the orange/brown quadrant).
- Dark: warm charcoal `oklch(0.185 0.012 45)` with lightened terracotta
  primary.
- Chart tokens are unthemed greys (shadcn defaults, unused).
- Sidebar tokens are shadcn defaults (partly unused; one references a
  blue-violet `oklch(0.488 0.243 264)` that never appears in the UI).

Gaps versus the redesign spec:

- No surface hierarchy (`surface`, `surface-elevated`, `surface-translucent`,
  `surface-strong`) — only `card`/`popover`.
- No glass tokens, no elevation/shadow tokens, no gradient tokens, no
  motion tokens, no seasonal accent tokens (season colours are hard-coded
  hex swatch data, which is correct for palette data but the *UI* has no
  seasonal accent language).
- No `success`/`warning`/`info` semantic tokens (alerts improvise with
  Tailwind palette classes).

## 3. Radii, shadows, depth

- Radius base `0.625rem` with multipliers (sm→4xl). Cards are `rounded-xl`,
  controls `rounded-lg` — reasonable, slightly small for the target look.
- Shadows: `shadow-xs` on cards, `shadow-sm` on active tabs — effectively
  flat. No layered/elevation system, no inner highlights, no glass.
- Depth model: borders only (`ring-1 ring-foreground/10` on Card). Uniform;
  every card has identical visual weight (visible on the landing page and
  dashboard where all cards compete equally).

## 4. Navigation

- `SiteHeader` (`components/layout/site-header.tsx`): sticky, `h-16`,
  `bg-background/90 backdrop-blur`, bottom border. Functional but generic;
  wordmark is serif; no scroll-state transition; CTA is a small default
  button.
- `AppShell` (`components/layout/app-shell.tsx`): SiteHeader + static left
  sidebar (`w-52`, muted active pill) + mobile bottom nav (5 items,
  `bg-background/95 backdrop-blur`). Works, but reads as a template: no
  surface separation between sidebar and canvas, no page-header pattern —
  every page hand-rolls its own `<h1>`.
- Admin layout adds a horizontal scrolling tab strip of 8 links above the
  content. On tablets it overflows awkwardly; active state is a muted pill.

## 5. Cards, forms, buttons

- `Card`: shadcn Base-UI port; `rounded-xl`, `ring-foreground/10`,
  `shadow-xs`, muted footer band. Used for *everything* (marketing bullets,
  dashboard actions, admin stat tiles, settings groups) → repeated cards
  with the same visual weight, flagged by the spec as an anti-pattern.
- `Button`: cva variants (default/outline/secondary/ghost/destructive/link);
  compact heights (h-8 default, h-9 lg). No glass/elevated variant, no
  loading state affordance (pages compose Spinner manually).
- Inputs: `h-8`, `rounded-lg`, transparent background, border-input — clear
  but small for touch (spec asks ~44px targets on mobile) and visually thin
  next to the planned glass surfaces.
- Forms are RHF + zod with visible labels and described errors (good;
  must be preserved).

## 6. Responsive behaviour

- Public pages: single `max-w-6xl` container, sections stack cleanly;
  fine at 320–1728px (verified during e2e work).
- App shell: sidebar hides < md, bottom nav appears — good pattern, but no
  safe-area inset handling (`env(safe-area-inset-bottom)`) for the bottom
  nav.
- Admin tables rely on horizontal scroll containers; header tab strip
  overflows with scroll — acceptable, but no sticky headers.

## 7. Dark mode

- Complete `.dark` token set exists in `globals.css`, and `next-themes` is
  **already in `package.json` — but no `ThemeProvider` is mounted and no
  toggle exists anywhere. Dark mode is dead code**; users can never reach
  it. The dark palette itself is an inversion of the warm theme and was
  never design-reviewed.

## 8. Loading, empty, error states

- History/favourites/admin pages have skeletons (`Skeleton`) that roughly
  match layout; empty states exist (`Empty` component) with icon + text +
  action — decent baseline.
- Processing step has a staged progress UI; quality-failure and API-error
  states exist with retake/retry paths (verified by e2e). These flows must
  survive restyling untouched.

## 9. Accessibility

Strengths (verified by axe in e2e; serious/critical = 0):

- Semantic landmarks, skip link, single h1 per page, correct heading order.
- Visible focus (`focus-visible` rings), `aria-current` nav states,
  labelled form fields, `aria-hidden` on decorative icons, reduced-motion
  guard in `globals.css`, in-text links underlined.
- Camera flow announces states; dialogs/sheets are Base UI (focus managed).

Risks to preserve through the redesign:

- Contrast: terracotta-on-porcelain currently passes AA; new translucent
  surfaces must keep ≥4.5:1 for text (biggest redesign risk).
- Tab/accordion/dialog semantics come from Base UI — restyle classes only,
  never the primitive structure.

## 10. Design inconsistencies found

1. Serif headings vs sans body everywhere, including places serif reads
   poorly (buttons' sibling labels, admin tables, mobile nav sheet title).
2. Identical card treatment across wildly different content densities.
3. Icon-in-tinted-square motif (`bg-primary/10` + lucide icon) repeated on
   nearly every marketing section and dashboard card — reads as template.
4. Alternating `bg-secondary/40` section stripes on every public page.
5. Sidebar tokens half-unused; chart tokens unthemed.
6. Buttons visually small (h-8) while marketing sections are airy — scale
   mismatch.
7. No motion language at all beyond hover translates on two cards.
8. Wordmark block is a rounded square with a Palette icon — generic.

## 11. Component disposition

Retain as-is (structure + behaviour, restyle via tokens only):
- All Base UI primitives in `components/ui/*` (accordion, alert-dialog,
  avatar, breadcrumb, checkbox, dialog, dropdown-menu, field, label,
  progress, radio-group, select, separator, sheet, skeleton, sonner,
  spinner, switch, table, tabs, textarea, tooltip).
- Form logic (`components/auth/*` handlers), wizard state machine
  (`wizard-context.tsx`), camera capture logic, upload dropzone logic,
  API client layer, swatch data plumbing.

Refactor (keep API, new visual treatment):
- `button.tsx` (new sizes + glass/loading), `card.tsx` (variants), 
  `input.tsx`/`textarea.tsx`/`select.tsx` (height + fill), `badge.tsx`,
  `empty.tsx`, `alert.tsx`, `progress.tsx`.
- `site-header.tsx`, `site-footer.tsx`, `app-shell.tsx`, admin layout.
- `swatch-grid.tsx`, `palette-view.tsx`, `product-card.tsx`,
  `analysis-card.tsx`, wizard step components (visual layer only).

Replace / new:
- Design-system layer: `glass-surface`, `page-container`, `page-header`,
  `section-heading`, `metric-card`, `colour-chip`, `status-indicator`,
  `gradient wash utilities` (new components under
  `components/design-system/`).
- Landing hero visual, seasons presentation, wordmark treatment.
- Theme provider + toggle (wire the existing `next-themes` dependency).

## 12. Pages with the greatest visual problems

1. Landing page — serif + stripe sections + uniform cards define the old
   look.
2. Dashboard — three identical cards + serif greeting; no hierarchy.
3. Results step — the product's money screen is a stack of same-weight
   cards; deserves the seasonal-atmosphere treatment the spec describes.
4. Admin pages — functional but visually identical to the user app;
   needs the productivity-tool treatment (solid dense surfaces, compact
   toolbar).
5. Auth pages — plain centred card, no material quality.

## 13. Risk areas where redesign could break functionality

- **Selectors:** e2e specs target roles/labels/text, not classes — safe if
  copy and roles are preserved. `getByLabel`, `getByRole` calls in
  `apps/web/e2e/*` must keep working; any heading-level change on
  seasons page must keep real `<h2>` season names (axe + e2e assert this).
- **Wizard state:** `processing-step` mutation start is StrictMode-guarded;
  do not touch effect logic while restyling.
- **Camera:** permission-denied fallback auto-switches to Upload tab; the
  tab structure must remain (test depends on it).
- **RTL unit tests** (24) assert visible labels/text in auth forms +
  consent + swatch grid — copy changes there must be mirrored in tests.
- **Print styles:** `[data-print-root]` palette card printing must survive.
- **CSP:** `next.config.ts` builds a strict CSP — no new external assets
  (fonts stay on `next/font`, no CDN images).
- **Contrast on glass:** biggest a11y risk; every glass surface needs a
  solid fallback and AA-checked text colours.

## 14. Pre-existing check status (baseline)

Recorded on `main` @ `353bac8` before any redesign change; all 4 GitHub
workflows (web-ci, api-ci, db-ci, e2e-ci) green; local
`lint / typecheck / test / build` for `apps/web` pass; 24 unit tests,
30 e2e tests, axe serious/critical = 0. Any post-redesign failure is
therefore redesign-caused.
