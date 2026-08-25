# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two roles, mirrored exactly in backend authorization (`[Authorize(Roles = "...")]`):

- **Captador** — field agent who visits ranches ("estancias") in person to register cattle
  lots and log ongoing events (weighing, health, movement, feeding). Works in rural areas
  with unreliable connectivity, on budget/low-end Android phones, so field screens must
  stay fast and simple rather than visually rich. Data is created offline and synced later;
  the sync state of each record (`Pendiente` / `Sincronizado` / `Error`) must stay visible
  to them.
- **Administrador** — office-based manager who oversees the whole operation: dashboard
  metrics, a productivity ranking of Captadores, a read-only master view of all field
  records, user/permission/device management, and an audit trail. Works from desktop or
  tablet with normal connectivity.

## Product Purpose

SIGA ("Sistema de Registro y Captación de Ganado") is a livestock-procurement tracking
system for a real livestock-buying company/client (not solely an academic exercise, though
it originates from a USFX Ingeniería de Software coursework project). It replaces informal/
paper tracking of cattle acquisition with a structured digital record: a Captador registers
a ranch, then registers "captaciones" (lots of cattle captured there, GPS-tagged), then logs
recurring field events against that lot until it moves toward processing ("faena"). Success
means field data reliably reaches the backend despite offline conditions, and management can
trust and act on it (traceability, productivity, sanitary/logistics decisions).

## Positioning

Not a generic offline-forms or fleet-tracking tool: the domain model (Estancia → Captación →
per-lot bitácoras of Pesaje/Sanitario/Movimiento/Alimentación → eventual faena) and the
offline-sync-with-per-record-provenance requirement are purpose-built for livestock
procurement, where "who recorded what, where, and when" is a commercial trust requirement,
not just an audit nicety.

## Operating Context

- A Captador travels to an **estancia** (ranch), captures its GPS location once (immutable
  after creation), and records owner/contact/land details.
- At the estancia, they create one or more **captaciones** (a captured lot of cattle: category,
  breed, head count, estimated weight, feeding regime, estimated faena date), also GPS-tagged.
- Over the life of a captación, Captadores (and in some cases any authenticated user — role
  restrictions vary per bitácora type, see backend) log **bitácoras**: Pesaje (weighing),
  Sanitario (health events — vaccination, deworming, routine check, treatment), Movimiento
  (transfers between potreros/corrales), Alimentación (feeding regimen updates).
- Administradores consume this through a **Maestro de Registros** (unified read-only view of
  all bitácoras), a **Mapa de Operaciones** (map of estancias/captaciones), a **Dashboard**
  (herd totals, category breakdown, monthly trends), a **Ranking de Productividad** (compares
  Captadores) and per-Captador productivity profiles, **Seguridad y Usuarios** (accounts,
  assigned sectors, linked devices, granular permissions), and **Trazabilidad/Auditoría**
  (who created/modified/deleted what, when).
- The visual system was designed first in Stitch ("SIGA DESIGN" project) as approved
  desktop+mobile mockups per screen (`design-reference/stitch-html/`); frontend implementation
  binds those approved layouts to real API data without altering the approved visual system.
- Backend is a .NET 8 API (`design-reference/especificacion-integracion-frontend.md` is the
  integration contract); enum values arrive PascalCase and are translated to Spanish labels
  centrally (`src/types/enums.ts`) — never derive labels with generic casing rules, some
  translations are irregular (e.g. `VacaDescarte` → "Vaca Descarte").

## Capabilities and Constraints

- Offline-first field capture: records can be created locally before connectivity returns;
  each record tracks its own sync state and local-creation timestamp for provenance.
- GPS capture is required at Estancia and Captación creation (via `navigator.geolocation`,
  previewed on a Leaflet map) and is fixed by the backend after initial registration — it
  cannot be edited later.
- Role boundaries are enforced by the backend, not just hidden in the UI: the frontend must
  mirror `[Authorize(Roles = "...")]` restrictions per endpoint exactly (see inline comments
  in `src/router/index.ts` citing the specific controller) rather than inventing its own rules.
- The 4 bitácora types share one "form + history" interaction pattern, implemented as a single
  parameterized component/config (`src/config/bitacoras.ts`), not 4 bespoke screens.
- Some backend behavior is known-buggy and tracked separately (`docs/bugs-backend.md`) —
  reproduced against the live API independent of the frontend; not something frontend work
  should route around silently.
- A running backlog of frontend design/UX gaps already exists (`docs/mejoras-frontend.md`,
  2026-08-21): mobile nav overflow for Administrador's 7 sections, no success toast after
  create/update actions, silent session expiry, undecided dark mode (Tailwind is configured
  for it but nothing activates it yet), icon-only buttons without visible tooltips,
  submit-only form validation, generic (unshaped) loading skeletons, and inconsistent icon
  reuse across screens. Treat this as known, self-reported technical/design debt — not a
  request to silently fix, but useful signal for where a design pass should start.
- No public registration or password recovery: accounts are provisioned only by an
  Administrador.

## Brand Commitments

Product name is fixed: "SIGA" (title-cased as `SIGA` in the UI), full name "Sistema de
Registro y Captación de Ganado" (from `index.html`'s `<title>`). No other binding brand
assets (logo, color mandate, tone-of-voice document) were found beyond the generic favicon
and the approved Stitch visual system already implemented.

## Evidence on Hand

- Approved visual reference: `design-reference/stitch-html/` — real desktop+mobile HTML
  mockups per screen, organized by build stage (01 login … 06 dashboard/usuarios/auditoría/
  productividad).
- Integration contract: `design-reference/especificacion-integracion-frontend.md`.
- Domain-model rationale: `design-reference/actualizacion-requisitos-y-modelo-dominio.md`
  (explains scope additions beyond the original requirements document, e.g. why an audit
  module exists even though the base spec didn't ask for one explicitly).
- Known backend defects: `docs/bugs-backend.md`.
- Self-identified frontend design backlog: `docs/mejoras-frontend.md`.
- No real customer testimonials, case studies, or press exist yet — do not fabricate any.

## Product Principles

1. The Stitch visual system is pre-approved product truth, not a suggestion: implementation
   binds real data to it without redesigning it out from under the business unless a design
   pass is explicitly requested.
2. Field reliability outranks field polish: offline capture and honest sync-state feedback
   matter more than visual richness on the Captador's budget Android screens.
3. Frontend role/permission behavior must mirror backend authorization exactly — never grant
   or hide an action the API contract doesn't actually allow for that role.
4. Every field record's provenance (who, when, sync state) stays visible — traceability is a
   commercial trust requirement for this business, not incidental audit logging.
5. Office (Administrador) and field (Captador) are different usage scenes: dashboards/tables
   can afford density and richness; field forms should stay fast, simple, and forgiving of
   interruption.

## Accessibility & Inclusion

No formal accessibility standard has been confirmed. Practical constraint established: many
Captadores use budget/low-end Android phones in the field, so mobile performance and
simplicity function as a de facto accessibility requirement for that role, independent of any
WCAG-style commitment.
