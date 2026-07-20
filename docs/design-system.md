# ColourSense Design System

The visual language introduced by the modern glass redesign
(`feat/modern-glass-ui-redesign`). Everything here is implemented as
tokens and utilities in `apps/web/src/app/globals.css` plus components
under `apps/web/src/components/{ui,design-system}`.

## Principles

1. **Content first.** Chrome recedes; palettes, results, and imagery
   carry the colour. UI chrome is neutral (cool off-whites, graphite).
2. **Restraint.** One accent family (blue-lilac), muted seasonal tints
   only where seasons are the content, gradients barely visible.
3. **Layered depth, lightly.** Borders and small soft shadows first;
   glass and floating elevation only for navigation, floating panels,
   modals, and the result hero.
4. **Honest and calm.** No hype copy, no fake progress, low-confidence
   states styled neutrally rather than as failures.
5. **Accessible by construction.** AA contrast in both themes, visible
   focus, reduced-motion and reduced-transparency fallbacks.

## Typography

Geist for everything; Geist Mono for technical values (HEX, Lab, IDs).
No serif. System fallback stack after Geist.

| Class | Size | Weight | Use |
|---|---|---|---|
| `.text-display` | clamp 38–64px | 650 | Landing hero only |
| `.text-title-1` | clamp 32–48px | 640 | Page/section h1–h2 |
| `.text-title-2` | clamp 24.8–34px | 600 | App page headers |
| `.text-title-3` | clamp 19.5–24px | 600 | Card/panel headings |
| `.text-eyebrow` | 13px, +5.5% tracking, uppercase | 550 | Section eyebrows, metadata labels |
| body | 15–17px | 400 | Copy |
| labels/nav | 13–15px | 500 | Controls |

Negative letter-spacing only at title sizes (−0.01 to −0.022em).
Uppercase only for `.text-eyebrow`.

## Colour tokens (OKLCH, `globals.css`)

Semantic pairs exist for light and `.dark`:

- Canvas: `--background` (cool off-white / deep charcoal `oklch(0.172 0.008 262)`), `--foreground` (graphite / soft white).
- Surfaces: `--surface` (quiet tint), `--surface-elevated`, `--surface-strong` (segmented-control tracks), `--card`, `--popover`.
- Lines: `--border`, `--border-strong`, `--separator`, `--input`.
- Action: `--primary` (graphite; inverts to soft white in dark), `--primary-hover`, `--primary-foreground`.
- Accent: `--accent` / `--accent-foreground` (soft blue-lilac fills).
- Semantics: `--destructive`, `--success`, `--warning`, `--info`, `--ring` (blue-lilac focus).
- Seasons: `--season-spring|summer|autumn|winter` — muted accents for
  washes, chart bars, and contextual decoration. Full-strength colour
  belongs to palette data (swatches), never to UI chrome.
- Glass ingredients: `--glass-base`, `--glass-border`,
  `--glass-highlight`, `--glass-shadow`.

Rule: components never hard-code colour values; the only raw colours in
JSX are data-driven swatches (`style={{ backgroundColor: hex }}`).

## Surfaces & glass

Six reusable material classes (`@supports` gated, solid fallback,
`prefers-reduced-transparency` fallback, single blur layer only):

| Class | Use |
|---|---|
| `.glass-subtle` | Floating in-canvas controls (camera bar) |
| `.glass-default` | Card variant `glass` |
| `.glass-elevated` | Floating contextual panels |
| `.glass-navigation` | Sticky header, mobile bottom bar |
| `.glass-modal` | Dialogs and sheets |
| `.glass-result` | Result hero / example-result panel |

Do **not** use glass for dense content (tables, long forms, long text),
or nest glass inside glass. Dense admin content sits on solid `--card`
with a `--surface` header band.

`Card` variants (`components/ui/card.tsx`): `default` (bordered),
`plain`, `tinted`, `glass`, `elevated`, `interactive` (hover lift).
Pick by content density, not decoration.

## Gradients

Utilities only — `.wash-page` (ambient canvas), `.wash-season`
(seasonal radial via `--season-tint`). Two stops, low opacity, solid
background-color fallback baked in. No gradient text, no gradients
behind body copy.

## Spacing, radius, elevation

- Spacing: Tailwind 4px system. Card padding 16–24px; section rhythm
  80–96px desktop / 64–80px mobile.
- Radius: base `--radius: 0.8rem` → controls ~13px (`rounded-lg`),
  cards 18px (`rounded-xl`), feature panels 23–28px
  (`rounded-2xl/3xl`). Pills only for segmented controls, tags, and
  the camera capture cluster.
- Elevation tokens: `--elevation-xs/sm/glass/floating/modal` exposed as
  `shadow-xs/sm/glass/floating/modal`. Borders before shadows.

## Motion

Tokens `--motion-fast: 160ms`, `--motion-medium: 240ms`,
`--motion-slow: 320ms`, easing `--ease-out-quart`. CSS transitions
only; opacity/transform/box-shadow. No bounce, parallax, floating, or
animated gradients. `prefers-reduced-motion` collapses everything.

## Components (design-system layer)

`components/design-system/`:

- `GlassSurface` — variant-mapped glass materials.
- `PageContainer` — width presets (narrow/default/wide) + gutters.
- `PageHeader` — app page title/description/actions row.
- `SectionHeading` — marketing eyebrow/title/lede (optionally centred).
- `MetricCard` — solid numeric tile (admin/dashboard).
- `EmptyState` — icon + title + one sentence + one action.
- `StatusIndicator` — dot + text (never colour-only).
- `ColourChip` — tactile swatch with inner hairline.
- `ThemeToggle` — light/dark, hydration-safe.

Grids use Tailwind grid utilities directly; a dedicated
responsive-grid component was intentionally skipped.

## Responsive rules

Tested at 320/375/390/430/768/1024/1280/1440/1728. No horizontal
overflow anywhere; wide tables scroll inside their own container.
Mobile bottom navigation respects `env(safe-area-inset-bottom)`.
Swatch rows are grids (shrinkable), never fixed-width flex rows.

## Accessibility rules

- axe (WCAG 2.1 A/AA) serious/critical = 0, enforced in e2e.
- Focus: 3px `--ring` ring on every interactive element.
- Text on washes/glass must hold 4.5:1 — avoid opacity on text
  containers; tint the background, not the copy.
- Meaning never by colour alone (labels accompany swatches/status).
- Real headings in document order; one h1 per page.
- Dialog/tab/accordion semantics come from Base UI primitives — style
  classes only.

## Dark mode

Class strategy via next-themes (`ThemeProvider` in `providers.tsx`,
toggle in the header). Dark is its own design: deep cool charcoal
canvas, translucent elevated surfaces, light-on-dark primary button,
brightened seasonal accents, `oklch(1 0 0 / n%)` hairlines. Never pure
black; never simply inverted values.

## Do / don't

- **Do** put dense data on solid surfaces; **don't** put tables on glass.
- **Do** use seasonal tints on results/seasons content; **don't** use
  all four seasons decoratively on one screen.
- **Do** reach for Card variants; **don't** hand-roll
  `bg-card ring-border …` strings in pages.
- **Do** keep buttons `rounded-lg/xl`; **don't** make everything a pill.
- **Do** use `text-eyebrow` for section labels; **don't** uppercase
  body copy.
- **Do** keep decorative compositions `aria-hidden` **and**
  AA-contrast for any visible text inside them.
