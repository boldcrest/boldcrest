# Progress log

The single place that says where the product is, what changed, and why. Updated at the end of every working session, before anything else.

**Plan:** `v1-product-build-plan.md` (currently v1.2)
**Branch:** `claude/clinic-app-market-research-682su6` (ahead of `main`, never pushed without Aldo's go)
**App version:** `0.2.0` (`clinic/package.json`)

---

## Where we are right now

| | |
|---|---|
| Phase | **0, decisions and foundations.** Phase 1 has not started |
| Last session | 19 September 2026 |
| Working tree | Clean. App 0.2.0, plan v1.2 and this file committed and pushed on 19 September 2026, tagged `clinic-v0.2.0` |
| Checks at last run | `tsc` clean, `eslint` clean, `vitest` 18/18, `build` green |
| Blocking | D1 (which finance app) and D4 (name and domain) |
| Next action | Step 1.1, restructure `clinic/` into the workspace. Does not depend on D1 or D4 |

---

## How versions work

| Thing | Scheme | Bumped when |
|---|---|---|
| **App** (`clinic/package.json`) | Semver. `0.x` until public launch, `1.0.0` at launch (end of Phase 7) | Minor for a finished plan step or a visible change. Patch for fixes. Every bump gets a changelog entry below and, once committed, a git tag `clinic-vX.Y.Z` |
| **Plan** (`v1-product-build-plan.md`) | `vMAJOR.MINOR` in its status line | Minor when a decision or a step changes. Major when phases or scope change |
| **Database** | Timestamped migrations in `packages/db`, forward-only | Every schema change. The migration name goes in the changelog entry |
| **Plans and prices** | `plan_versions` rows in the database | Any price or limit change. Existing subscribers stay on their version |

A changelog entry says what changed, why, and what it touched. Newest first.

---

## Decisions

| # | Decision | Status | Date | Answer |
|---|---|---|---|---|
| D1 | Which finance app we integrate | **Open** | | Adapter is built against fature.al and easyPos API shapes until named |
| D2 | Legal seller and payment method | Decided | 2026-09-18 | We sell it ourselves. Clinics pay by credit card, auto-renewing. Processor still to choose (step 0.3), Stripe is not available to an Albanian seller |
| D3 | How messages are sent | Decided, revised same day | 2026-09-18 | Staff click a button, WhatsApp opens with the message ready on the clinic's own number, they send it. **Never a message goes out automatically.** No WhatsApp API, no connecting accounts, no SMS. Supersedes the earlier reading ("each clinic connects its own number through Meta"), which was my misunderstanding |
| D4 | Product name and domain | **Open** | | Placeholder `PRODUCT`. Gates the marketing site and the links patients receive |
| D5 | Botulinum toxin charting in Albania | Decided | 2026-09-18 | Not ours to police. The Aesthetics pack is product-agnostic, the clinic is responsible for what it stocks and charts |
| D6 | Visual language | Decided | 2026-09-18 | Achromatic chrome, colour only as blurred light fields. No dot-matrix numerals. The design conventions in the repo `CLAUDE.md` are superseded |
| D7 | Finance scope | Decided | 2026-09-18 | Invoicing, fiscalization and accounting are an integration with another app, not built in-product |

---

## Phase tracker

Status: ⬜ not started · 🟨 in progress · ✅ done · ⛔ blocked. Step numbers match section 12 of the plan.

### Phase 0: decisions and foundations

| Step | Work | Status | Notes |
|---|---|---|---|
| 0.1 | Answer D1 and D4 | 🟨 | D2, D3, D5 answered 18 Sep |
| 0.2 | Finance app: docs, test account, one fiscalized test invoice by hand | ⛔ | Waits on D1 |
| 0.3 | Choose card processor, apply for merchant account, register domain | ⬜ | Domain waits on D4 |
| 0.4 | Supabase (Frankfurt), Vercel, Cloudflare, Sentry, Postmark, 1Password. Sign Supabase DPA | ⬜ | |
| 0.5 | Brief the lawyer: DPA, terms, privacy, DPO, wet-ink consent, retention periods | ⬜ | |
| 0.7 | Recruit 5 founding clinics (3 dental, 2 aesthetics) | ⬜ | |

### Phase 1: platform spine

| Step | Work | Status |
|---|---|---|
| 1.1 | Convert `clinic/` to the workspace (apps + packages) | ⬜ |
| 1.2 | Bring `CLAUDE.md` in line with the new design | ⬜ |
| 1.3 | Local Supabase stack, migrations, type generation, seed | ⬜ |
| 1.4 | Schema domains A, C, D, J, K and the three core patterns | ⬜ |
| 1.5 | Auth, MFA, invitations, token hook, clinic switcher | ⬜ |
| 1.6 | Permission map and role-aware navigation | ⬜ |
| 1.7 | Replace `store.tsx` with a Supabase data layer, same selectors | ⬜ |
| 1.8 | Audit log with read logging, compliance dashboard v1 | ⬜ |
| 1.9 | Italian staff UI, i18n lint | ⬜ |
| 1.10 | CI gates and preview deploys | ⬜ |
| 1.11 | Job runner (pgmq, pg_cron, worker) | ⬜ |

### Phases 2 to 9

| Phase | Scope | Status |
|---|---|---|
| 2 | Base product: resources and calendar, patient record, files, forms and consent, visits, recall engine v2, send queue with click-to-send WhatsApp, online booking, reports, import | ⬜ |
| 3 | Commercial layer: plans, entitlements, metering, card billing, operator console, support access, sign-up and onboarding, marketing site | ⬜ |
| 4 | Money and the finance integration: charges, payments, installments, adapter, corrections, patient card payments | ⬜ |
| 5 | Vertical packs in parallel: Dental (odontogram, plans, quotes, lab) and Aesthetics (charting, inventory and lots, photos, series, provenance) | ⬜ |
| 6 | Private beta and hardening: 5 then 15 to 25 clinics, performance, restore drill, pen test, DPIA, help center, PWA | ⬜ |
| 7 | Public launch | ⬜ |
| 8 | Tourism module | ⬜ |
| 9 | Imaging, Marketing, API, multi-location, region | ⬜ |

Steps inside phases 2 to 9 get their own rows here when the phase starts.

---

## Changelog

### 2026-09-18 · plan v1.2 · D3 revised: manual send only

**Why:** Aldo corrected my reading of D3. A clinic does not connect anything. Staff click, WhatsApp opens with the text ready, they send. Never a message goes out automatically.
**Changed in the plan:**
- Section 9 rewritten around a **send queue**: the job runner prepares each due message, a person sends it with one click, the confirm link is the proof of receipt. States plainly what this model cannot do (delivery receipts, in-app replies, unattended or bulk sending) and what replaces each.
- Removed: Meta Cloud API, Embedded Signup, Tech Provider application, BSP fallback, SMS gateway, in-app inbox, reply-to-confirm, message allowances, message packs, SMS pricing, messaging metering. Steps 0.3b and 0.6 deleted. D4 no longer gates anything at Meta.
- Schema domain K: `channel_accounts`, `conversations`, `message_events` dropped. `outbound_queue` added. `messages` records the click and the marked-sent, never a delivery state.
- Section 3.4: messaging cost is zero. Gross margin about 71% / 83% / 88%. Running cost at 100 clinics falls from $3,700 to $4,800 to roughly $1,000 to $1,500. Tiers now differ by capability, not by a message meter.
- Steps 2.7 and 2.8 rewritten. New risks: reminders depend on a person clicking, and WhatsApp may restrict numbers that send repetitive messages.
- Fixed: the old decisions table had been left dangling under the new one in v1.1.

### 2026-09-18 · plan v1.1 · decisions D2, D3, D5

**Why:** Aldo answered four of the five open decisions.
**Changed in the plan:**
- D2: card-only subscriptions sold by us. Section 8.1 rewritten, bank transfer removed from V1, step 0.3 now chooses a card processor, step 3.5 is card billing with 3-D Secure renewals, new risk row for recurring cards in Albania.
- D3 (**superseded by v1.2**): every clinic connects its own WhatsApp number. Section 9 rewritten around Meta Embedded Signup (Tech Provider) with BSP sub-accounts as fallback. New step 0.3b. Step 2.8 now includes "Connect WhatsApp" per clinic. New tier row: connecting a number is a Clinic and Pro feature, manual send stays on every tier.
- D3 side effect: under Embedded Signup Meta can bill the clinic directly, which would take messaging cost off our books. Noted in section 3.4, settled in step 0.6.
- D5: the Aesthetics pack is product-agnostic. Neuromodulator protocol added to the default pack, editable like the rest.
- D4 remains open and is now flagged as gating Meta's review.
**Also:** this file created. App version bumped to 0.2.0.

### 2026-09-18 · plan v1.0 · V1 product build plan

**Why:** the demo covered the basics. Aldo asked for a full plan for a market-ready product with tiers, payments, database and phases.
**Added:** `docs/product/v1-product-build-plan.md`. Base platform plus Dental and Aesthetics packs, three tiers (Start €24, Clinic €59, Pro €129) with add-ons, operator console, about 90 tables in 17 domains, finance adapter contract, two payment flows, nine phases with numbered steps, launch checklist.
**Source:** all eleven docs under `docs/research` and `docs/product`, plus the demo's `lib/demo/types.ts`.

### 2026-09-18 · app 0.2.0 · visual rewrite (committed 19 September, tag `clinic-v0.2.0`)

**Why:** Aldo rejected the 0.1.1 look and supplied gradient-bloom references. Instruction: ignore the design conventions in `CLAUDE.md` and rewrite. Product and legal decisions in that file still stand.
**Changed:**
- `src/app/globals.css` rewritten: warm near-white canvas, ink-black actions (teal accent removed), new radius and shadow scales, `.bloom` (light card, colour from within) and `.mesh` (saturated) light-field families with light and dark palettes, `--b-ink` on-colour type, `ruler` instrument, `hairline` utility.
- `src/components/viz.tsx` new: `Metric`, `ArcGauge`, `Ruler`, `Sparkbars`, `Callout`, `Bloom`.
- `src/components/shell.tsx` rewritten: floating rail, ink-pill active state, `AppMark`.
- `src/components/ui.tsx` retuned: buttons, cards, pills, controls, modal.
- `src/app/(app)/paneli/page.tsx` rewritten as an asymmetric bento: day figure with half-hour load strip, confirmation gauge, two attention tiles, agenda, attention list, recent visits. Every figure is read from the store.
- `orari`: provider tints mixed from one hue per clinician instead of Tailwind palette boxes. `konfirmo`: shared `AppMark`. `layout.tsx`: loading skeleton matches the new dashboard. `i18n.ts`: six new dashboard keys in sq and en.
- **Removed on Aldo's instruction:** dot-matrix numerals. Big figures are solid tabular type.
**Verified:** `tsc`, `eslint`, 18/18 tests, production build. Light and dark at 1440, light at 375, captured with Playwright.
**Known:** the repo `CLAUDE.md` still describes the old design (fixed in step 1.2).

### 2026-09-18 · app 0.1.1 · `3f42a48`

First redesign: grey canvas, floating cards, gradient-mesh tiles. Superseded by 0.2.0.

### 2026-09-18 · app 0.1.0 · `a1a5ca1`

Interactive demo: patient records, schedule, WhatsApp reminders with confirm links, protocol-driven follow-ups, demo clock, sq and en. State in `localStorage`. 18 tests.

### 2026-07-13 · research and product docs

Market research report, business case, aesthetics market, competitor teardowns, regulatory memo, fiscalization comparison, architecture spec, feature catalog, security plan, infrastructure plan. MVP demo build plan added 18 September.

---

## Open verifications carried from the research

| Item | Owner | Plan step |
|---|---|---|
| Recurring card product available to an Albanian seller (Paysera, Raiffeisen, BKT) | us | 0.3 |
| Supabase PITR and WAL archive region, in writing | us | 0.4 |
| DPO threshold, standard DPA clauses | IDP Commissioner, via counsel | 0.5 |
| Wet-ink consent, record retention periods, telemedicine for pre-consults | health-law counsel | 0.5 |
| Real clinic and dentist counts | USSH | before pricing is final |
| Competitor prices (DentalSoft.al, BeautyBooking.al, DenteX) | mystery shop | before launch |

---

## How to update this file

1. Change "Where we are right now".
2. Flip the step status in the phase tracker.
3. Add a changelog entry on top: date, version, why, what changed, what was verified.
4. If a decision was made, add or update its row. Never delete a decision, supersede it.
