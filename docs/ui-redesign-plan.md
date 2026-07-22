# UI Redesign Plan — Modern Glass Direction

Branch: `feat/modern-glass-ui-redesign`. Spec:
`COLOURSENSE_MODERN_UI_REDESIGN_PROMPT.md`. Audit:
`docs/ui-redesign-audit.md`.

## Design direction (summary)

Calm, precise, Apple-inspired beauty-tech. Geist everywhere (no serif).
Cool off-white canvas with graphite ink; terracotta demoted from brand
primary to a data colour inside palettes. Primary action = graphite
near-black. One restrained accent (soft blue-lilac) used sparingly.
Layered glass for navigation/floating panels only; solid surfaces for
dense content. Seasonal accents (spring/summer/autumn/winter, muted)
appear only on results, seasons content, and small contextual touches.
Motion: 150–350ms opacity/transform, reduced-motion respected.

## Phases → commits

Each phase lands as one Conventional Commit on the branch; verify
(`lint`, `typecheck`, `test`, `build`) before every commit; e2e before
push milestones.

| Phase | Commit | Scope |
|---|---|---|
| 0 | `chore(ui): audit existing frontend design system` | This document + audit |
| 1 | `feat(ui): introduce modern design tokens and typography` | `globals.css` rewrite (tokens/glass/elevation/motion/dark), `layout.tsx` (drop Fraunces, theme provider), core `ui/*` restyle, `design-system/*` components, theme toggle |
| 2 | `feat(ui): redesign navigation and application shell` | `site-header`, `site-footer`, `app-shell`, admin shell, page-header pattern |
| 3 | `feat(marketing): redesign public pages` | landing, how-it-works, seasons, products, faq, legal, analysis entry |
| 4 | `feat(auth): redesign authentication screens` | auth shell + 4 forms |
| 5 | `feat(analysis): redesign analysis wizard experience` | stepper, consent, guidance, capture, preview, processing, quality |
| 6 | `feat(results): redesign colour analysis results` | result hero w/ seasonal atmosphere, palette tabs, swatches, products, technical |
| 7 | `feat(dashboard): modernise authenticated user pages` | dashboard, history, detail, favourites, settings, privacy |
| 8 | `feat(admin): modernise admin interface` | admin dashboard, tables, forms, CSV import flow, audit log |
| 9 | `fix(ui): responsive, dark-mode and accessibility refinement` | safe-area, 320px pass, dark review, axe fixes |
| 10 | `docs(ui): document the Match.Lab design system` + `test(ui)` if needed | design-system.md, redesign report, README/status updates, final QA, push, PR |

## Phase 1 file plan (foundations)

- `apps/web/src/app/globals.css` — full token rewrite:
  - Neutral system: `--background` cool off-white `oklch(0.985 0.002 247)`;
    `--foreground` graphite `oklch(0.21 0.01 260)`; muted/secondary cool
    greys; borders low-contrast cool.
  - Primary: graphite near-black (light) / soft white (dark);
    accent: blue-lilac `oklch(~0.55 0.06 275)` used sparingly.
  - New semantic tokens: `--surface`, `--surface-elevated`,
    `--surface-translucent`, `--surface-strong`, `--separator`,
    `--success`, `--warning`, `--info`, seasonal
    `--season-spring/summer/autumn/winter` (+ `-foreground` pairs where
    needed), `--glass-highlight`, `--glass-shadow`.
  - Elevation: `--shadow-xs/sm/glass/floating/modal` + Tailwind theme
    mapping.
  - Motion: `--motion-fast: 160ms`, `--motion-medium: 240ms`,
    `--motion-slow: 320ms`, `--ease-out-quart`.
  - Glass utilities: `.glass-subtle`, `.glass-default`, `.glass-elevated`,
    `.glass-navigation`, `.glass-modal`, `.glass-result` — color-mix
    backgrounds, `backdrop-filter` with `@supports` solid fallbacks, dark
    variants; single-layer blur only.
  - Gradient utilities: `.wash-page`, `.wash-hero`, `.wash-season-*`
    (low-opacity radial washes with solid fallback).
  - Typography plumbing: `--font-heading` → Geist; display scale via
    `clamp()` utility classes (`.text-display`, `.text-title-1..3`).
  - Keep: reduced-motion block, print block, Tailwind v4 `@theme inline`.
- `apps/web/src/app/layout.tsx` — remove Fraunces import/variable; add
  `ThemeProvider` (next-themes, `attribute="class"`, system default,
  `suppressHydrationWarning`).
- `apps/web/src/app/providers.tsx` — mount ThemeProvider.
- `components/ui/` restyles: `button.tsx` (taller default h-9/lg h-11,
  new `glass` variant, loading spinner slot), `card.tsx` (variant prop:
  plain/bordered/tinted/glass/elevated/interactive), `input.tsx`,
  `textarea.tsx`, `select.tsx` (h-10, filled translucent bg), `badge.tsx`
  (quieter), `tabs.tsx` (segmented glass track), `dialog.tsx`/`sheet.tsx`
  (glass-modal material), `alert.tsx` (semantic tones), `skeleton.tsx`
  (calmer pulse), `progress.tsx`.
- New `components/design-system/`: `glass-surface.tsx`, `page-container.tsx`,
  `page-header.tsx`, `section-heading.tsx`, `metric-card.tsx`,
  `empty-state.tsx` (wraps ui/empty), `status-indicator.tsx`,
  `colour-chip.tsx`, `theme-toggle.tsx`, `season-wash.tsx`.
- `docs/design-system.md` started (finished in phase 10).

## Component migration plan

`font-heading` stays as the utility name — re-pointed to Geist at the
token level so all 38 files migrate visually at once; per-page passes
then adjust weight/tracking/size where serif metrics assumed. Card
call-sites move to explicit variants gradually (default stays
`bordered`, visually calm). No breaking prop changes to `ui/*`
components — additive variants only, so untouched pages keep compiling.

## Testing plan

- After each phase: `pnpm --filter web lint && pnpm --filter web
  typecheck && pnpm --filter web test && pnpm --filter web build`.
- RTL specs updated in the same commit as any copy change.
- E2E (30 specs, port 3100) after phases 2, 5, 6, 8 and before final
  push; axe checks are embedded in e2e (serious/critical must stay 0).
- Manual viewport sweep at 320/375/390/430/768/1024/1280/1440/1728 in
  phase 9 (Playwright screenshot script, both themes).
- Screenshot comparison vs baseline set at every phase (kept out of
  repo).

## Visual acceptance criteria

Per spec §30 — key measurable ones: zero `font-fraunces` references;
terracotta absent from chrome (allowed only inside palette/product
swatch data); glass only on nav/floating/modal/result surfaces; all
text ≥ AA contrast in both themes; no horizontal overflow at 320px;
axe serious/critical = 0; all 24 unit + 30 e2e pass; production build
passes.

## Known risks & mitigations

| Risk | Mitigation |
|---|---|
| Glass text contrast fails AA | tokens tuned with ≥72% opacity fills; axe in e2e gates it |
| e2e selector drift | copy/roles preserved; run e2e at phases 2/5/6/8 |
| StrictMode wizard regression | never touch step effect logic, style-only edits |
| Dark-mode hydration flash | next-themes class strategy + suppressHydrationWarning |
| backdrop-filter perf on mobile | single blur layer, ≤20px radius, `@supports` fallback, no full-screen blur |
| Print palette card breaks | keep `[data-print-root]` untouched; verify in phase 6 |

## Rollback approach

Every phase is one commit on the feature branch; `main` untouched until
PR review. Any phase can be reverted individually (`git revert <sha>`)
without breaking earlier phases because changes are additive at the
token/variant layer. If the whole direction is rejected, deleting the
branch restores the status quo — no backend or contract files change.
