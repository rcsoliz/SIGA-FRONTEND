---
name: SIGA — Sistema de Registro y Captación de Ganado
description: Utilitarian field-tool precision for offline-first livestock capture, built on a Material Design 3 token system.
colors:
  primary: "#0F5238"
  on-primary: "#FFFFFF"
  primary-container: "#2D6A4F"
  on-primary-container: "#A8E7C5"
  primary-fixed: "#B1F0CE"
  primary-fixed-dim: "#95D4B3"
  on-primary-fixed: "#002114"
  on-primary-fixed-variant: "#0E5138"
  inverse-primary: "#95D4B3"
  secondary: "#7A5649"
  on-secondary: "#FFFFFF"
  secondary-container: "#FDCDBC"
  on-secondary-container: "#795548"
  secondary-fixed: "#FFDBCF"
  secondary-fixed-dim: "#EBBCAC"
  on-secondary-fixed: "#2E150B"
  on-secondary-fixed-variant: "#603F33"
  tertiary: "#274F3D"
  on-tertiary: "#FFFFFF"
  tertiary-container: "#3F6754"
  on-tertiary-container: "#B8E3CB"
  tertiary-fixed: "#C1ECD4"
  tertiary-fixed-dim: "#A5D0B9"
  on-tertiary-fixed: "#002114"
  on-tertiary-fixed-variant: "#274E3D"
  error: "#BA1A1A"
  on-error: "#FFFFFF"
  error-container: "#FFDAD6"
  on-error-container: "#93000A"
  background: "#F8F9FA"
  on-background: "#191C1D"
  surface: "#F8F9FA"
  on-surface: "#191C1D"
  surface-variant: "#E1E3E4"
  on-surface-variant: "#404943"
  surface-dim: "#D9DADB"
  surface-bright: "#F8F9FA"
  surface-container-lowest: "#FFFFFF"
  surface-container-low: "#F3F4F5"
  surface-container: "#EDEEEF"
  surface-container-high: "#E7E8E9"
  surface-container-highest: "#E1E3E4"
  surface-tint: "#2C694E"
  outline: "#707973"
  outline-variant: "#BFC9C1"
  inverse-surface: "#2E3132"
  inverse-on-surface: "#F0F1F2"
typography:
  headline-xl:
    fontFamily: "Inter, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  headline-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: "28px"
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  body-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label-md:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
    letterSpacing: "0.05em"
  button:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
rounded:
  DEFAULT: "4px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  base: "4px"
  stack-sm: "8px"
  stack-md: "16px"
  stack-lg: "24px"
  margin-mobile: "16px"
  gutter-mobile: "12px"
  touch-target-min: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target-min}"
  button-primary-hover:
    backgroundColor: "{colors.on-primary-fixed-variant}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.primary}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target-min}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.primary}"
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.lg}"
    height: "{spacing.touch-target-min}"
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: SIGA — AgroField Precision

## Overview

**Creative North Star: "AgroField Precision"**

AgroField Precision is a Material Design 3 system stripped down to what a Captador needs while
standing in a pasture, phone in one hand, cattle in the other. Every load-bearing control —
buttons, inputs, the GPS-capture card, the bottom nav — is sized to the 48px minimum touch
target and pairs a firm `active:scale-[0.98]` press with a 200ms transition, so the interface
reads as something built to be operated at arm's length, in bright sun, in a hurry, on a
budget Android phone. Surfaces stay flat (a whisper of `shadow-sm`, nothing more) so nothing
competes with the data; a deep forest-green primary and a warm clay-brown secondary carry the
system's identity instead of ornament. The same components serve the Administrador's desktop
dashboards without alteration — density comes from layout (more cards, wider tables, a
persistent sidebar), never from shrinking the touch-first component language itself.

Icons are Lucide (`@lucide/vue`), rendered through a single `AppIcon.vue` wrapper keyed by the
same semantic names the app already used (`home_work`, `edit`, `scale`, …), at the system's
standard 2px stroke weight. This replaced the original Material Symbols Outlined icon font:
ligature-based glyphs from a shared Google font read as generic/interchangeable with every
other AI-scaffolded app, where real vector strokes read as a considered, professional line-icon
system — and it matches the 2px stroke already established by secondary buttons and the
GPS-capture empty state, so no other visual language changed.

The palette and type scale were extracted 1:1 from the project's own approved Stitch mockups
(`design-reference/stitch-html/`) — this is documentation of a design system that already
shipped, not a new proposal. A full Material Design 3 dark scheme exists in `theme.css`
(`.dark` block, toggled via `ThemeToggle.vue` and a `useTheme` composable) but Stitch's own
source only ever declared a light scheme; the dark values were derived afterward by mechanical
M3 rules (see `theme.css`'s header comment) and whether dark mode ships as a supported feature
is still an open product decision (`docs/mejoras-frontend.md` #4). Treat dark values here as
implemented-and-available, not yet a confirmed product commitment.

**Key Characteristics:**
- Material Design 3 semantic color roles (primary/secondary/tertiary/error × on/container/fixed, full surface-container ramp), sourced as RGB triples in `theme.css` for Tailwind's opacity-composition pattern.
- Inter for every text role; no display/serif pairing — this is a utility system, not an editorial one.
- 48px minimum touch target on every interactive control, full-width by default on mobile.
- Flat-by-default elevation; `shadow-lg` reserved strictly for anything that floats above the page.
- Firm, springy press feedback (`active:scale-[0.95]`–`[0.98]`) rather than hover-driven affordance, because the primary device class is touch.
- Lucide line icons (2px stroke, `currentColor`) through one `AppIcon.vue` component — no icon font, no per-screen icon choices.

## Colors

Three brand hues on a near-neutral M3 surface ramp; color carries meaning (state, role, urgency) more than decoration — the palette is restrained everywhere except status badges and charts.

### Primary
- **Deep Forest** (`#0F5238`): the system's one confident color — primary actions (`BaseButton` primary variant), active nav state, focus rings, the "Óptimo"/"Sincronizado"/"Registrado" status family. Used on white text at full strength; used as a 10% tint (`bg-primary/10`) for the calm/positive badge background.
- **Deep Forest Container** (`#2D6A4F`): the sidebar/header brand mark background and the GPS-capture "capture" button before a point is recorded.

### Secondary
- **Clay Brown** (`#7A5649`): warm counterpoint to the primary green — used sparingly for the "Pendiente"/"En Observación"/"En Planificación de Faena" status family (things that are true but not yet resolved) and for the captured-GPS marker icon background.

### Tertiary
- **Sage** (`#274F3D`): a second, quieter green — used for the "Procesado" terminal status, the info variant of `AlertBanner`, and as the alternate series color in bar charts (`MonthlyBarChart`) so two metrics on one dashboard never fight for the same hue.

### Neutral
- **Surface** (`#F8F9FA` background / `#FFFFFF` container-lowest): the resting page and card background — nearly white, not stark white, so white card surfaces (`surface-container-lowest`) still read as a step up from the page.
- **On-Surface** (`#191C1D`): primary text.
- **On-Surface Variant** (`#404943`): secondary/label text, placeholder text, muted icons.
- **Outline / Outline Variant** (`#707973` / `#BFC9C1`): borders on inputs, cards, dividers — outline-variant is the default resting border; outline (darker) shows up on focus/active states like the captured-GPS button.
- **Error** (`#BA1A1A`) / **Error Container** (`#FFDAD6`): validation errors, delete confirmation, the "Crítico" sanitary status.

### Named Rules
**The Container-Pair Rule.** Every semantic color is consumed in `base`/`on-base` pairs or `container`/`on-container` pairs, never a bare hue against an assumed background — this is what makes the same badge components correct in both light and dark without their own dark-mode branching.

**The One Confident Color Rule.** Primary green is the only hue allowed on a filled, full-strength button. Secondary and tertiary only ever appear as containers, 10–50% tints, or badge accents — they inform, they don't compete for the primary action.

## Typography

**Body/UI Font:** Inter (system sans-serif fallback)
**Icon Font:** Material Symbols Outlined (`FILL 0` default, `FILL 1` for emphasized/selected icons)

**Character:** One typeface, weight and size doing all the work. Inter's low-contrast, open forms hold up at small sizes on cheap screens in direct sunlight — there's no *separate display face*, only Inter at a bigger step. The one narrow exception is KPI stat numbers (Headline XL), where a genuinely bigger number earns its place on a dashboard tile — everywhere else stays legible density, not a hero moment.

### Hierarchy
- **Headline XL** (700, 32px/40px, -0.02em): KPI stat-tile numbers only (`KpiCard.vue`) — never used for page titles or section headings.
- **Headline Large** (700, 24px/32px, -0.02em): page titles ("Listado de Estancias", dashboard headers).
- **Headline Medium** (600, 20px/28px, -0.01em): section/card/dialog titles, the "SIGA" wordmark.
- **Body Large** (400, 16px/24px): primary form input text, GPS coordinate readout.
- **Body Medium** (400, 14px/20px): body copy, descriptions, table cells, toast messages.
- **Label Medium** (600, 12px/16px, 0.05em, uppercase in form field labels): field labels, badges, nav labels, pagination text.
- **Button** (600, 16px/24px): all button and action-link text.

### Named Rules
**The Uppercase-Label Rule.** Form field labels (`FormField.vue`) are Label Medium set uppercase with wide tracking — this is the one place the system uses case as a hierarchy signal, and it is reserved for labels only, never for headings or buttons.

## Layout

Single-column, card-stacked content on mobile; a fixed 256px (`w-64`) left sidebar plus fluid content on desktop (`md:` / 768px breakpoint). Page content caps at `max-w-[1400px]`, centered, with `p-stack-md` (16px) mobile / `p-stack-lg` (24px) desktop outer padding and `gap-stack-lg` (24px) between major sections.

Mobile navigation is a fixed 80px bottom bar showing each role's "principal" routes (max 3–4, so nothing scrolls off-screen) plus a "Más" button opening a bottom-sheet drawer for the rest — a deliberate departure from copying the Stitch mockups' inconsistent nav, derived instead from the app's real routes per role. Desktop replaces both with the persistent sidebar; there is no tablet-specific third layout, only the `md:` cutover.

Spacing runs on an 8px-multiple scale (`base` 4px, `stack-sm` 8px, `stack-md` 16px, `stack-lg` 24px) with two mobile-specific aliases (`margin-mobile` 16px, `gutter-mobile` 12px) kept distinct from the generic scale so mobile page edges and mobile card padding can be retuned independently of the desktop rhythm.

## Elevation & Depth

Flat by default. The overwhelming majority of surfaces — cards, list headers, form fields, the search bar — carry only `shadow-sm`, a barely-there separation from the page background; depth mostly comes from the `surface` → `surface-container-*` tonal ramp, not from shadow. `shadow-lg` is reserved exclusively for things that physically float above the page: the `ConfirmDialog` modal, `ToastContainer` toasts, the mobile bottom-nav bar, and its "Más" drawer sheet.

### Named Rules
**The Flat-By-Default Rule.** Surfaces at rest use `shadow-sm` or no shadow at all. `shadow-lg` is a signal reserved for overlay/floating chrome (modals, toasts, sheets, the persistent bottom nav) — if a new component isn't floating above other content, it doesn't earn `shadow-lg`.

## Shapes

Two radius steps do almost all the work: `rounded-lg` (8px) for interactive controls (buttons, inputs, nav items, list rows) and `rounded-xl` (12px) for containers (cards, dialogs, the GPS map preview, drawer sheets). `rounded-full` is reserved for pill shapes with a specific meaning — status badges, pagination controls, avatar/icon roundels, and the one explicitly-requested pill button (Login's desktop CTA). Borders are consistently 1px `outline-variant` at rest; the notable exception is `BaseButton`'s secondary/outline variant and `GpsCapture`'s uncaptured state, both of which use a heavier 2px stroke by explicit design-system directive ("Secondary buttons use an outlined style with a 2px stroke" — Stitch's own AgroField Precision spec). `GpsCapture` additionally uses a 2px **dashed** border while no location is captured, switching to solid-tinted once a point exists — the only dashed-border usage in the system, reserved for "this is a placeholder waiting to be filled" states.

## Components

### Buttons
- **Shape:** `rounded-lg` (8px) by default; `rounded-full` only where a mockup explicitly calls for a pill (rare — flagged via a `pill` prop, not a default).
- **Primary:** `bg-primary` / `text-on-primary`, full-width by default (`block: true`), 48px tall, `hover:bg-on-primary-fixed-variant`, `shadow-sm shadow-primary/10`.
- **Secondary:** `bg-surface-container-lowest`, `text-primary`, 2px `border-outline-variant`, `hover:bg-surface-container-low` — no fill, defined by its stroke.
- **Text:** transparent background, `text-primary`, `hover:bg-surface-container-low`.
- **Universal states:** `active:scale-[0.98]`, `disabled:opacity-50`, loading state swaps content for a spinning ring (never a skeleton) so button height never shifts mid-submit.

### Badges (status chips)
- **Style:** `rounded-full`, 1px border, `label-md` text, always paired with a small solid dot or filled icon (never color alone) — `SyncBadge`, `EstadoCaptacionBadge`, `EstadoSanitarioBadge`, `EstadoUsuarioBadge` all follow this exact shape.
- **State-to-color mapping:** resolved/positive states → primary; pending/in-progress states → secondary; critical/blocking states → error; terminal/neutral states → tertiary or surface-container-highest. The mapping is consistent across all four badge families even though the underlying enums differ.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `surface-container-lowest` (white in light mode) on the `background`/`surface` page.
- **Shadow Strategy:** `shadow-sm` at rest; see Elevation & Depth.
- **Border:** 1px `outline-variant`, universal.
- **Internal Padding:** 24px (`p-6`) for content cards/KPI tiles; `margin-mobile` (16px) for list-row cards on mobile.

### Inputs / Fields
Two distinct input languages exist by deliberate design intent, not inconsistency:
- **`BaseInput` (auth-only):** pill-adjacent rounded-lg field with a leading icon in a 48px-tall bordered box; used only on Login.
- **`FormField` (all data-capture forms):** an uppercase label above a borderless field; on mobile the whole field is a bordered/shadowed card (`rounded-xl`, `shadow-sm`) so touch targets stay generous without a visible input outline, and on desktop (`md:`) the card chrome disappears in favor of a conventional bordered input — the same component serving two renderings by breakpoint, not two components.
- **Focus:** 1px ring + border color shift to `primary` (to `error` when invalid).
- **Error:** red border/ring plus a `body-md` error message below the field, driven either by an external prop or `FormField`'s own blur-triggered required-field check.
- **Validation timing:** on blur, not only on submit (a deliberate fix over the original submit-only pattern — see `docs/mejoras-frontend.md` #6).

### Navigation
- **Desktop (≥768px):** fixed 256px sidebar, brand mark + wordmark at top, `rounded-lg` nav items with `bg-primary-container` active state, user identity + theme toggle + sign-out pinned to the bottom.
- **Mobile (<768px):** fixed top app bar (logo + theme toggle + sign-out) and a separate fixed bottom nav (`rounded-t-xl`, `shadow-lg`) showing only each role's 3–4 "principal" routes plus a "Más" button that opens a bottom-sheet drawer (`slide-up` transition, `shadow-lg`, drag-handle affordance bar) for the rest.
- **Active state:** `bg-primary-container` / `text-on-primary-container` / bold weight, identical treatment across sidebar, bottom nav, and drawer.

### GPS Capture (signature component)
The `GpsCapture` component is the system's most distinctive piece: a dashed-border "empty" card that becomes a solid-tinted card with an inline Leaflet map preview once `navigator.geolocation` returns a point. It exists because field data entry is worthless without provenance, and a captured lat/long is confirmed visually (not just numerically) before the user can trust it — the map preview exists specifically to catch a GPS error (0,0, wrong country) before submission. The same visual grammar (dashed → solid, secondary-container icon roundel, inline status copy) should be reused for any future "must confirm real-world state before proceeding" capture step; don't invent a new pattern for that job.

### Icons
Lucide (`@lucide/vue`), rendered through one `AppIcon.vue` wrapper (`src/components/ui/AppIcon.vue`) keyed by semantic name — never imported directly in a view. 2px stroke, `currentColor` (inherits the surrounding text color automatically, no separate color prop needed), default 20px optical size with explicit `:size` overrides at each call site to match context (14–16px inline in badges/chips, 28–44px in empty-state illustrations). Two Leaflet marker call sites (`GpsCapture.vue`, `MapaOperacionesView.vue`) build marker HTML outside Vue's render tree and can't mount a component there, so they inline the same Lucide "map-pin" SVG path by hand instead of switching languages for two markers.

## Do's and Don'ts

### Do:
- **Do** pair every status color with a redundant non-color signal (icon or dot) — badges never rely on hue alone.
- **Do** keep interactive controls at a 48px minimum height/width, full-width on mobile by default.
- **Do** use `shadow-sm` (or no shadow) for anything at rest on the page, and reserve `shadow-lg` for overlay/floating chrome only.
- **Do** use the container/on-container pairing for any new semantic color usage, never a bare hue on an assumed background.
- **Do** reuse the canonical icon-per-concept mapping documented in `AppShell.vue` (e.g. `home_work` = Estancia, `scale` = Pesaje, `vaccines` = Sanitario, `local_shipping` = Movimiento, `grass` = Alimentación) rather than picking a new icon for an existing concept.
- **Do** add new icons to `AppIcon.vue`'s map and reuse its semantic key everywhere — never import a Lucide component directly in a view.

### Don't:
- **Don't** introduce gradients, illustration, imagery, or skeuomorphic texture — the system has none, and its flat/tonal identity depends on staying that way.
- **Don't** reintroduce an icon font (Material Symbols or otherwise) — the ligature-glyph look was the thing this system moved away from; real vector strokes only.
- **Don't** shrink touch targets below 48px on any surface a Captador might use in the field, even on dense Administrador screens.
- **Don't** add a second display/heading typeface — Inter carries the entire hierarchy through weight and size alone.
- **Don't** treat dark-mode values as a finished product decision — they're implemented in `theme.css` but whether dark mode ships is still open (`docs/mejoras-frontend.md` #4); don't cite their existence as proof the feature is done.
- **Don't** rely on hover-only affordance for anything that must work on the primary device class (touch); hover states are a bonus for desktop, not the mechanism.
