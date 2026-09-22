# Progress log

The single place that says where the product is, what changed, and why. Updated at the end of every working session, before anything else.

**Plan:** `v1-product-build-plan.md` (currently v1.2)
**Branch:** `claude/clinic-app-market-research-682su6` (ahead of `main`, never pushed without Aldo's go)
**App version:** `0.4.0` (`clinic/apps/app/package.json` — the workspace root carries its own version and is not the app's)

---

## Where we are right now

| | |
|---|---|
| Phase | **1, platform spine.** Phase 0 still open on D1 and D4, which block nothing in phase 1 |
| Last session | 22 September 2026 |
| Working tree | Clean. App 0.4.0 committed 22 September, not pushed |
| Checks at last run | All green. `tsc` 5/5 packages, `eslint` clean, `vitest` 87/87 (27 core, 21 app, 33 db, 6 i18n), `build` green |
| Blocking | D1 (which finance app) and D4 (name and domain). Neither blocks phase 1 |
| Next action | Domain C: patients, allergies, notes, recommendations, benefits — as tables with RLS, then port the patient screens off the fake store |
| Needs Aldo | Vercel root directory must change from `clinic` to `clinic/apps/app` or nothing deploys. Supabase Frankfurt project (0.4) needs his account and a signed DPA |

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
| D8 | Staff password reset | Decided | 2026-09-22 | **No self-service reset for staff.** The option does not exist, so there is no reset link to phish. The owner clicks Reset next to the person, which kills the old password and issues a one-time code valid for an hour; the owner hands it over and **the staff member sets their own password**. The owner never learns it, so the audit log still proves who acted. Owner recovery: two owners per clinic, printed recovery codes, and us as a logged last resort after a verified phone check |
| D9 | Account suspension | Decided | 2026-09-22 | The owner can **lock an account outright**, separately from resetting a password, for the day someone is dismissed. Locking revokes sessions immediately, removes the person from assignable lists, and keeps every note, appointment and audit entry they created. Staff are never deleted, because the audit trail must always resolve to a person. Reversible in one click. Locking and unlocking are themselves audited |
| D10 | Operator access to patient data | Decided | 2026-09-22 | **We can never read a patient record. Non-negotiable, and it outranks support convenience.** Aldo: if clinics find out we can see their patient files we are out of the market in three days. Enforced as a database privilege, not a missing screen: the operator role holds no grants on any patient or clinical table, so Postgres refuses the query whoever asks. The owner-granted, time-boxed support access that section 4.1 of the plan described is **withdrawn for clinical data** — consent is not wanted here, because the existence of the path is itself the liability. Support sees billing, plan, usage counts and system health only. Honest limit, written down rather than glossed: a database superuser could still grant themselves access, so the remaining controls are who holds production credentials, a break-glass procedure that is loud, and the clinic's own audit log |

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
| 1.1 | Convert `clinic/` to the workspace (apps + packages) | ✅ |
| 1.2 | Bring `CLAUDE.md` in line with the new design | ✅ |
| 1.3 | Local Supabase stack, migrations, type generation, seed | ⬜ |
| 1.4 | Schema domains A, C, D, J, K and the three core patterns | 🟨 A done (clinics, memberships, the operator wall). C next |
| 1.5 | Auth, MFA, invitations, token hook, clinic switcher, owner-driven password reset (D8) and account locking (D9) | ⬜ |
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

### 2026-09-22 · domain A · clinics, memberships, and the wall

**Why:** the first real tables, and the first migration that has to carry D9 and D10 rather than describe them.

**Clinics and memberships.** A person is not a user of the platform, they are a member of a clinic, so the role lives on the membership — the same human can work at two clinics with two roles. Row-level security on both tables, `force`d so a future migration running as owner cannot read across tenants either. No delete privilege on memberships at all: people are locked, never removed, or the audit trail stops resolving to a person.

**D9 now bites.** `app.clinic_id()` no longer trusts the token by itself. The claim says which clinic; the function confirms an **active** membership backs it. So locking a dismissed member takes effect on their next query rather than whenever their access token happens to expire — which was the hole recorded when D9 was taken. `security definer`, because the function is called by the policy on the very table it reads and would otherwise recurse. The old claim-only test was rewritten rather than deleted: it now asserts both halves, and a claim naming a clinic the person does not work at answers null.

**D10 is a privilege, and it is default-deny.** Clinic data lives in `public`; anything we may see lives in a new `ops` schema. The `operator` role gets usage on `ops` and nothing whatsoever on `public` — and, crucially, `alter default privileges ... revoke` so that tables written months from now are unreachable without anyone remembering this decision. The test enumerates every table in `public` and asserts the operator is refused each one, so it keeps proving itself as the schema grows.

**Caught while building:** revoking `usage on schema public` from `operator` by name does nothing, because that privilege is inherited from the built-in PUBLIC role. It has to be taken from PUBLIC and handed back explicitly to `authenticated`, `anon` and `service_role`. Table privileges were already denied, so the wall stood regardless — but the first version of this migration would have read as stronger than it was, which is exactly the failure mode D10 is about.

**Tests:** 72 → 87. The tenancy set is written as attempts rather than happy paths: edit the clinic in the token, plant a member in someone else's clinic, delete a locked colleague, read a table as the operator.

### 2026-09-22 · decision D10 · we can never read a patient record

**Why:** Aldo, unprompted and absolute: "I don't want access to edit or see their patients. That's the number one non-negotiable. If they find out I can see their patient files I am done and out of the market in three days." Commercial reasoning, not only legal, and it is the stronger position.

**What changes in the plan.** Section 4.1 described operator support access to patient records, time-boxed and granted by the clinic owner, every read written to their audit log. That was the standard processor model and it is now withdrawn for clinical data. The reasoning: consent does not help here, because what damages us is not misuse but the *existence* of the path. A clinic that learns we could look, with permission, has still learned we could look.

**How it is enforced.** As a privilege, never as an absent screen. The operator role receives no grants on any patient or clinical table, so Postgres refuses the query no matter which application asks. This has to be true from the first migration that creates those tables, not added later, because "we removed the screen" and "we cannot read it" are very different claims and only one survives a clinic's technical adviser asking.

**What support keeps:** billing, subscription and plan, usage counts, send-queue health as numbers, error rates, system state. Enough to run the business, nothing that identifies a patient.

**The limit, stated rather than glossed:** we host the database, so we possess the data. A database superuser can grant themselves anything. What stands between is who holds production credentials, a break-glass procedure that is noisy and audited, and the clinic's own audit log. Field-level encryption with a key we never hold is the only thing that would make this a mathematical guarantee rather than a procedural one, and it costs search, reporting and recoverability — worth revisiting for the most sensitive fields, not worth promising now.

**Consequences to carry:** we cannot diagnose a clinic's data problem by looking at it, so support has to be built around exports, screenshots and clinic-side tools. Migrations still run over patient rows — that is code, not a person, and the distinction needs writing down before someone blurs it. Backups and restores still move the data, and the restore drill has to respect the same boundary.

### 2026-09-22 · the demo now runs the real database

**Why:** Aldo asked how to build the real product and still have something to click through — and said this was his own idea, from a developer he had watched switch users in a dropdown and see different access, against the real system. It also answers the problem from the session before: the demo had no concept of a user, so three features had just been designed with no permission boundary at all (`StaffRole` was declared in `types.ts` and used nowhere).

**What changed.** PGlite runs in a browser as well as in node, so the demo no longer needs a fake store to have data. `packages/db` gained a generated module holding the schema as strings — the browser has no filesystem — and a `bootstrap()` / `beginSession()` pair that the test harness and the app now both use, so tests and demo apply byte-identical SQL. A drift test fails if the generated module falls behind the `.sql` files.

**`/baza`** is the first page served by it: a real Postgres boots in the page in about 400–850 ms, applies the migrations, and answers a live `app.has_perm()` query for whichever role is chosen in a dropdown. As owner, eleven permissions. As reception, clinical and settings and audit go grey. Anonymous is refused outright by Postgres with "permission denied for schema app". Nothing on the page decides any of that.

**What it does not prove**, stated on the page itself: the page chooses its own claims, so it can impersonate anyone. It demonstrates that the policies behave; it is not a security boundary. That arrives with server-signed tokens on Supabase, and the `packages/db` suite is what gates it.

**Consequence for the plan:** step 1.7 ("replace store.tsx with a Supabase data layer, same selectors") effectively starts now against PGlite instead of later against Supabase. Swapping to supabase-js afterwards is a client change, not a UI change. The fake store stays under every screen that has not been ported.

**Open decision:** the demo clock. The app owns `now` today; real queries would default to Postgres's clock. The time-travel buttons have to keep working, so the clock has to be passed into every date-aware query. Better settled before the first domain lands.

### 2026-09-22 · app 0.4.0 · follow-ups become a cadence, and the patient record grows

**Why:** three changes Aldo asked for. Follow-ups needed a clearer structure and had to be near-automatic: a service that should be repeated monthly must say so by itself. Patients needed full birthdays, allergies, free-form notes and a panel for what the clinician recommends next. Discounts and gifts had to be recordable.

**1. Follow-ups are driven by the service, and a course is one row.**
A protocol step can now repeat: `repeat: { everyDays, times }`. Logging one visit generates the whole series at once, so a six-session monthly course is on the books from the first session and nobody has to remember the next one. `openSeries()` then collapses every occurrence of one step of one visit into a single row — the session to act on, how many are finished, how many are queued — because six rows for one patient would bury five other patients. The page is now ordered by urgency (me vonesë / sot / këtë javë / më vonë) instead of due-versus-upcoming, and every row states its cadence in words a clinic uses: `formatCadence()` says "çdo muaj", never "çdo 30 ditë".
Settings gained **Trajtim i ri**, which creates the service and its follow-up steps in one form, because they are one decision. Verified end to end in the browser: new service with a monthly course → log a visit → "U krijuan 6 ndjekje sipas protokollit" → the course appears on the record at session 1 of 6.

**2. The patient record.**
`birthYear` became a full `birthDate` and age is derived everywhere, so it cannot go stale; a birthday within a week shows on the header. `allergies` render above everything else, in danger tone with a warning icon, because they change what a clinician may do — and the empty state is shown too, since "nothing recorded" and "nobody asked" otherwise look identical. `notes` replaced the single free-text note: many notes, each with an optional custom label, pinned ones first. `recommendations` are new — what the clinician thinks should still happen, with proposed → accepted → booked/done/declined, and booking one from the record links the appointment back to it.

**3. Discounts and gifts.**
`Benefit` records a percentage or an amount, what it applies to, who gave it, why, when it expires and when it was used. It is deliberately a record of the decision and not an accounting entry — the invoice belongs to the finance app (D1), and the card says so.

**Schema consequence for 1.4:** domains C and D have to carry all of this — `protocol_steps.repeat`, `follow_ups.occurrence`/`series_length`, `patients.birth_date`/`allergies`, `patient_notes`, `recommendations`, `benefits`.
**Tests:** 34 → 70. New: `packages/core` recurrence and series (13) and record helpers (11), `packages/i18n` formatter tests (6, the package had no test setup before), and seed integrity for the new records.
**Storage key** bumped to `arnika.demo.v2`; a v1 payload would hydrate into the new UI missing every new field.
**Pre-existing, not introduced here:** the root layout's pre-paint theme script sets a class on `<html>`, which React reports as a hydration mismatch in dev. It is the usual price of avoiding a theme flash.

### 2026-09-22 · step 1.4 in progress · the database is testable without Docker

**Why:** there is no Docker on this machine, so `supabase start` cannot run a local stack, and the hosted Frankfurt project does not exist yet (0.4, needs Aldo's account and a signed DPA). Neither is a reason to wait: PGlite is Postgres compiled to WASM, so the migrations can be applied and the policies exercised for real, in-process, and the same files then run unchanged on Supabase.
**Added:** `packages/db/tests/harness.ts` applies `supabase-shim.sql` and then every migration in filename order against a fresh in-memory Postgres, and `asUser()` runs a query as a signed-in member by setting the `request.jwt.claims` GUC and `SET LOCAL ROLE authenticated` inside a transaction — the same mechanism PostgREST uses, so a policy reads its claims in tests exactly as it will in production. `btree_gist` is bundled with PGlite, so the EXCLUDE constraint that makes double-booking impossible can be tested too.
**Added:** `tests/supabase-shim.sql` — the three Supabase roles our GRANTs name, plus `auth.jwt()`, `auth.uid()` and a minimal `auth.users`. Test-only; it never ships.
**Added:** `tests/app-helpers.test.ts`, 16 tests over the four tenancy helpers. What they pin down: `app.clinic_id()` returns null (never a wrong uuid) for a token with no clinic or an empty claim; `app` is unreachable from an anonymous request; the role map is asserted per role, including that reception has no clinical access, an assistant can read clinical context but not write it, the accountant has only `schedule.read`, and `staff.manage` and `audit.read` are owner-only; an unknown role or permission key denies rather than falling through.
**Closed:** the `@clinic/db` TS18003 red from the previous entry. Workspace is green: tsc 5/5, vitest 34/34, build.
**Still to do in 1.4:** the tables themselves — domains A (clinics, memberships), C (patients), D (schedule, with the EXCLUDE constraint), J (files and consent), K (messaging queue) — each with RLS and a cross-tenant isolation test.

### 2026-09-22 · app 0.3.0 · steps 1.1 and 1.2 · the workspace

**Why:** the demo was a single Next.js app. Everything after this step — a database package, shared UI, an operator console later — needs more than one deployable, so the split comes before the schema rather than after it.
**Step 1.1.** `clinic/` is now a pnpm + turborepo workspace: `apps/app` (the Next.js app) and `packages/core` (pure domain logic, no React), `ui` (CSS tokens, `ui.tsx`, `viz.tsx`), `i18n`, `db`. Tests split 3 in core and 15 in the app, still 18.
**Step 1.2.** `CLAUDE.md` rewritten around the 0.2.0 design: the bloom/mesh system and the viz instruments replace the grey canvas, two radii, teal accent and `.dots`; the workspace layout and `corepack pnpm` commands replace the npm ones; decisions D1–D9 and the process rules are stated so they are not re-litigated.
**Obstacles worth remembering:** pnpm is not on PATH and `corepack enable` fails with EACCES, so every command is `corepack pnpm` and turbo needs a shim at `node_modules/.bin/pnpm`, written by `scripts/ensure-pnpm-shim.js` on postinstall.
**Known red:** `@clinic/db` typecheck fails with TS18003 because its tsconfig includes `tests/**/*.ts` and no test exists yet. 1.4 closes it.
**⚠ Deploy:** Vercel's root directory still points at `clinic`. It must become `clinic/apps/app` or the next push will not build.

### 2026-09-22 · decisions D8 and D9 · account access

**Why:** Aldo: staff should not be able to reset their own passwords, only the admin, and the owner should also be able to lock an account outright the day someone is dismissed.
**Decided:** D8 (owner-initiated reset, staff-chosen password, no self-service path) and D9 (suspension separate from reset). Both shape step 1.5.
**Design consequence to settle in 1.5:** suspension must bite immediately. Revoking the refresh token stops renewal, but an access token already issued stays valid until it expires, so a dismissed person could keep reading for that window. Fix: shorten the access token lifetime and make `app.clinic_id()` return null for a membership that is not active, which costs one indexed lookup per statement and makes the lock take effect on the next query.
**Also:** Postmark dropped from the budget for now (free tier at beta, revisit if delivery suffers). Beta running cost about $235 a month.

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
