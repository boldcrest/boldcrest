# Boldcrest repo

Two things live here:

- **root** — the Boldcrest marketing site (Next.js + Sanity). Its own `package.json`.
- **`clinic/`** — a separate Next.js app: the clinic-platform demo. Its own `package.json`;
  run it with `cd clinic && npm install && npm run dev`. Never run the clinic app from the
  repo root.

## The clinic product

A modular SaaS for dental and medical-aesthetic clinics, launching in Albania (Tirana),
then Balkans/EU. Built dental-and-aesthetics in parallel, not one after the other.

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
docs/product/mvp-demo-build-plan.md            v0.1 scope
```

## Decisions already made (do not re-litigate)

- **Albanian is the default UI language**, English toggle. Patient messages render in the
  *patient's* language (sq/it/en), independent of the clinic's UI language.
- **Albanian orthography**: weekdays and months are lowercase. Never use CSS `capitalize` on
  dates; use `capitalizeFirst()` from `src/lib/i18n.ts`.
- **WhatsApp carries scheduling text and links only.** Commissioner Guideline No. 2 of
  30.04.2025 forbids health data over personal apps. Clinical content stays behind the
  patient portal. This is a selling point, not a limitation.
- **Fiscalization goes through a certified partner** (easyPos or fature.al), never self-
  certification: VKM 239/2020 demands 10 staff, 1 year trading, 30M ALL turnover and a
  10M ALL (~EUR 97k) bank guarantee.
- **No Stripe in Albania.** Paysera/EasyPay locally; Stripe via a UK Ltd for foreign deposits.
- **Supabase, Frankfurt region**, RLS as the security boundary. Every documented Supabase
  breach was missing RLS, so cross-tenant RLS tests gate deploys.
- **Closest competitor is DenteX (dentex.al)**, an Albanian dental-tourism CRM. It has no
  patient booking, no portal, no odontogram, no public pricing, and no verifiable customers.

## Demo app conventions (`clinic/`)

- State lives in `src/lib/demo/store.tsx` (React context + localStorage + cross-tab sync).
  There is no database yet; swapping in Supabase should not change the UI.
- A **demo clock** (`state.now`) drives everything. Never call `Date.now()` for "today" in
  product code; read `now` from `useDemo()`.
- Icons: **Phosphor** (`@phosphor-icons/react`) only. Never hand-roll SVG icons.
- Motion: `motion/react`, restrained; everything honours `prefers-reduced-motion`.
- One radius scale (`rounded-card`), one accent colour (teal), semantic status colours
  always paired with an icon and a label, never colour alone.
- **No em-dashes anywhere in user-visible copy.**
- Checks before committing: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`,
  `npm run build`.

## Gotchas

- The dev/prod server renames itself to `next-server`, so `pkill -f "dist/bin/next"` misses
  it. Kill by PID from `ps -eo pid,cmd | grep next-server`, or by port.
- Rebuilding while an old server runs leaves it serving HTML that points at deleted chunks,
  which shows up as 500s on `/_next/static/...`. Kill the old server before rebuilding.
- React 19's `react-hooks/set-state-in-effect` lint rule is enforced. Derive state or use
  `useSyncExternalStore` instead of setting state inside an effect.
