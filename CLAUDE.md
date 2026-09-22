# Boldcrest repo

Two things live here:

- **root** — the Boldcrest marketing site (Next.js + Sanity). Its own `package.json`.
- **`clinic/`** — the clinic-platform product, a pnpm + turborepo workspace.
  Never run clinic commands from the repo root.

## The clinic product

A modular SaaS for dental and medical-aesthetic clinics, launching in Albania (Tirana),
then Balkans/EU. One base platform (calendar, patients, consent, recalls, messaging,
online booking, reports, roles and audit) plus two vertical packs built in parallel —
Dental and Aesthetics — sold in three tiers with add-ons. Finance, invoicing and
fiscalization are not built in-product: they are an integration with a separate finance
app (`docs/product/v1-product-build-plan.md` section 7).

Research and planning docs (all cited, read these before re-deriving anything):

```
docs/research/market-research-report.md        needs, competitors, scanner APIs, tourism, Albania
docs/research/business-case.md                 segments, TAM/SAM/SOM, pricing, GTM, risks
docs/research/aesthetics-market-albania.md     aesthetics vertical deep dive
docs/research/competitor-teardowns.md          DenteX, Pabau, BeautyBooking.al + parity matrix
docs/research/regulatory-compliance-memo.md    primary-source verified Albanian law
docs/research/fiscalization-partner-comparison.md
docs/product/platform-architecture-spec.md     shared core vs vertical modules
docs/product/feature-catalog.md                every feature vs competitor benchmark, MVP cut
docs/product/security-plan.md                  Supabase security design
docs/product/infrastructure-plan.md            stack, costs, messaging strategy
docs/product/mvp-demo-build-plan.md            v0.1 scope (superseded by the v1 plan below)
docs/product/v1-product-build-plan.md          the build plan: phases, database, pricing, launch checklist
docs/product/progress.md                       where we are, decisions log, changelog — read this first
```

## Decisions already made (do not re-litigate)

- **Albanian is the default UI language**, English toggle, Italian being added for staff UI.
  Patient messages render in the *patient's* language (sq/it/en), independent of the clinic's
  UI language. Weekdays and months are lowercase (Albanian orthography); never CSS `capitalize`
  on dates, use `capitalizeFirst()` from `@clinic/i18n`.
- **WhatsApp is click-to-send only.** A `wa.me` link opens the clinic's own WhatsApp with the
  text ready; a person presses send. **No message is ever sent automatically** — no Meta API,
  no SMS gateway, no in-app inbox. WhatsApp/SMS may carry scheduling text and links only, never
  health data (Commissioner Guideline No. 2 of 30.04.2025); clinical content stays behind the
  patient portal.
- **Finance, invoicing and fiscalization are an integration with another app**, never built
  in-product. Which app is still open (decision D1 in `progress.md`).
- **We sell the product ourselves; clinics pay by credit card only**, auto-renewing. No Stripe
  for an Albanian entity.
- **We can never read a patient record (D10).** Non-negotiable, and it outranks support
  convenience — Aldo: clinics finding out would end the business in days. Enforced as a database
  privilege: the operator role holds no grants on any patient or clinical table, so Postgres
  refuses the query whichever app asks. Never as an absent screen. No owner-granted support
  access to clinical data either — the path existing is itself the liability. Support sees
  billing, usage and system health only. Never design a feature that needs us to look.
- **The aesthetics pack is product-agnostic about botulinum toxin.** The clinic is responsible
  for what it stocks and charts; we ship charting, lot tracking and provenance and make no claim
  about any product's legal status.
- **Product name and domain are undecided** (decision D4). `PRODUCT` is the placeholder.
- **Supabase, Frankfurt region**, RLS as the security boundary — every documented Supabase
  breach was missing RLS, so cross-tenant RLS tests gate merges.
- **Closest competitor is DenteX (dentex.al)**, an Albanian dental-tourism CRM with no patient
  booking, no portal, no odontogram, no public pricing, and no verifiable customers.

## Workspace and commands

Layout of `clinic/`, a pnpm + turborepo workspace:

```
clinic/
  apps/app/           the Next.js clinic app
  packages/core/      @clinic/core   pure domain logic (protocols, WhatsApp message building), no React
  packages/ui/        @clinic/ui     design system: CSS tokens and classes, ui.tsx, viz.tsx
  packages/i18n/      @clinic/i18n   dictionaries and format helpers
  packages/db/        @clinic/db     SQL migrations and database tests
```

Run everything from `clinic/`, never from the repo root. pnpm is not installed globally on
Aldo's machine, so every command goes through corepack: `corepack pnpm install`,
`corepack pnpm dev` (http://localhost:3000). Before committing: `corepack pnpm typecheck`,
`corepack pnpm lint`, `corepack pnpm test`, `corepack pnpm build`.

`apps/app` has its own `AGENTS.md`: this Next.js version has breaking changes from what you
know, and `node_modules/next/dist/docs/` must be read before writing Next-specific code.

Database tests run on PGlite (Postgres in WASM) through vitest inside `packages/db` — there is
no Docker on Aldo's machine. A real local Supabase stack arrives in a later build step and
needs Docker.

## The domain model (what the demo already knows)

- **A service carries its own follow-ups.** A `Treatment` points at a `Protocol` whose steps
  each fire `offsetDays` after a visit. A step with `repeat: { everyDays, times }` is a
  **course**: the whole series is generated the moment the visit is logged, so a monthly
  recall is never something a person has to remember. Settings → Trajtimet creates a service
  and its steps in one form.
- **A series is one thing in the work list.** `openSeries()` collapses every occurrence of one
  step of one visit into a head (the occurrence to act on), the ones queued behind it, and how
  many are finished. Never list six sessions of one patient as six rows.
- **Cadence is written the way a clinic speaks.** `formatCadence()` gives "çdo muaj", not
  "çdo 30 ditë"; days only when the interval is not whole months or weeks.
- **The patient record holds four things beyond contact details**: a full `birthDate` (age is
  always derived, never stored), `allergies` (rendered above everything else, because they
  change what a clinician may do), `notes` (each with an optional custom label, pinned notes
  first), and `recommendations` (what a clinician thinks the patient should still have done —
  advice with a status, distinct from a protocol running on its own schedule).
- **`Benefit` records a discount or a gift, not an accounting entry.** The invoice lives in the
  finance app; this is the trace of who decided what and why. Say so in the UI.

## Design system conventions

- **Achromatic chrome, colour only as light.** Buttons, nav and card backgrounds are ink,
  white and paper, never a brand hue — ink-black primary actions and active nav, white cards
  on a warm near-white canvas (`--bg`). Colour appears only as a blurred light field glowing
  out of a card.
- **`.bloom`** — the default card: light (`--b-base`), a hot core (`--b-core`) fading through
  `--b-mid` to paper (`--b-edge`) at the rim, ink text (`--b-ink`). Palettes: `bloom-amber`,
  `bloom-rose`, `bloom-green`, `bloom-blue`, `bloom-violet`, `bloom-quiet`. The focal point
  (`--b-x`/`--b-y`, the `Bloom` component's `focal` prop) moves per instance so tiles never
  bloom from the same spot. In dark mode the same core reads as emitted light off a near-black
  card.
- **`.mesh`** — a saturated field, white text, reserved for surfaces that are themselves the
  message (e.g. `AppMark`). Palettes in the CSS today: `mesh-ink`, `mesh-green`.
- **Colour semantics**: a dashboard tile stays paper (`bloom-quiet`) at zero and takes a
  palette above zero, so colour always means "something needs you". Status colours (`--ok`,
  `--warn`, `--danger`) are always paired with an icon and a label, never colour alone.
- **Radius scale**: `--r-tile` (30px), `--r-panel` (22px), `--r` (14px, card), `--r-sm` (10px)
  — `rounded-tile` / `rounded-panel` / `rounded-card` in use; buttons and pills are
  `rounded-full`.
- **Shadows**: warm-tinted scale `--shadow-card` / `--shadow-raised` / `--shadow-float` /
  `--shadow-pop` (a neutral black shadow on warm paper reads as dirt), one easing curve
  `--ease`, used as `ease-[var(--ease)]`.
- **`@utility hairline`** (`box-shadow: inset 0 0 0 1px var(--border)`), used as `dark:hairline`
  on floating cards which have no shadow to separate them from the page in dark mode.
- **Instruments live in `viz.tsx`**: `Metric`, `ArcGauge`, `Ruler`, `Sparkbars`, `Callout`,
  `Bloom` — plain SVG/CSS, deliberately no charting library, nothing animates on mount.
- **Big figures are solid tabular type** (`Metric`, `.nums`). The dot-matrix numeral treatment
  was removed at Aldo's explicit request — do not reintroduce it.

## Code conventions

- Icons: **Phosphor** (`@phosphor-icons/react`) only. Never hand-roll SVG icons.
- Motion: `motion/react`, restrained; everything honours `prefers-reduced-motion`.
- Grid children that hold wide rows need `min-w-0`, or they push the page sideways on a phone.
- **No em-dashes anywhere in user-visible copy.**
- A **demo clock** (`state.now` from `useDemo()`) drives everything that means "today". Never
  call `Date.now()` for it in product code.
- React 19's `react-hooks/set-state-in-effect` lint rule is enforced. Derive state or use
  `useSyncExternalStore` instead of setting state inside an effect.

## Process

- `docs/product/progress.md` is updated at the end of every working session, before anything
  else: the status block, the phase tracker, and a changelog entry (what changed, why, what
  was verified). Decisions are never deleted, only superseded.
- `docs/product/v1-product-build-plan.md` is the build plan; its version line and
  `progress.md` follow the versioning scheme documented in `progress.md`.
- Never push without Aldo's go.

## Gotchas

- The dev/prod server renames itself to `next-server`, so `pkill -f "dist/bin/next"` misses
  it. Kill by PID from `ps -eo pid,cmd | grep next-server`, or by port.
- Rebuilding while an old server runs leaves it serving HTML that points at deleted chunks,
  which shows up as 500s on `/_next/static/...`. Kill the old server before rebuilding.
- A screenshot taken from a hidden in-app browser pane is paint-throttled and can look like
  missing or half-faded content when nothing is wrong. Check `document.visibilityState` and
  probe computed opacity before believing it; use Playwright for captures you need to trust.
