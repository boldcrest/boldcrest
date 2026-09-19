# V1 Product Build Plan: from demo to a product on the market

**Date:** 18 September 2026
**Status:** v1.2, 18 September 2026. D2 to D5 decided by Aldo (D3 revised: manual send only), D1 still open. Progress and version history live in `progress.md`.
**Reads with:** `platform-architecture-spec.md` (what is core vs vertical), `feature-catalog.md` (feature benchmarks), `security-plan.md`, `infrastructure-plan.md`, `../research/*`. This plan does not repeat their evidence. It turns them into a build order, a database, a price list and a launch checklist.

---

## 0. The short version

1. **What ships as V1:** one base platform (calendar, patients, consent, recalls, messaging, online booking, reports, roles and audit) plus two vertical packs built in parallel (Dental, Aesthetics), sold in three tiers with add-ons. Tourism, Imaging and Marketing arrive as add-on modules after launch.
2. **What we do not build:** invoicing, fiscalization and accounting. Those live in a separate finance app. We own "what was done and what is owed"; the finance app owns "the legal invoice and the books". One adapter connects them.
3. **Two products, not one.** The clinic app is what the client sees. The operator console is what you use to run the business: tenants, plans, billing, support, feature rollout. Both are in scope from Phase 3.
4. **The demo carries over.** Its screens, its i18n, its protocol and WhatsApp logic and its 18 tests survive. Its `localStorage` store is replaced by Supabase behind the same selector interface.
5. **Timeline for one or two builders working with AI:** real clinics on real data around week 18, public launch around week 30, Tourism module by month 12. Section 12 has the step list.
6. **No message ever leaves on its own.** The product prepares the right message for the right patient at the right time and puts it in front of a person. That person clicks, WhatsApp opens on the clinic's own number with the text ready, and they press send. There is no Meta integration, no message cost, and nothing to get approved. This is how the demo already works.

### Decisions

| # | Decision | Status |
|---|---|---|
| D1 | **Which finance app** do we integrate, and does it have an API with a test environment? | **Open.** Until named, the adapter is built against the fature.al and easyPos API shapes from `fiscalization-partner-comparison.md`, and the driver is swapped later. |
| D2 | Legal seller and how clinics pay | **Decided: we sell it ourselves, clinics pay by credit card.** Card-only, monthly or annual, auto-renewing. Consequence: an Albanian seller cannot use Stripe, so the card processor is Paysera recurring or a bank acquirer (Raiffeisen, BKT). Choosing between them is step 0.3. No bank-transfer flow in V1. |
| D3 | How messages are sent | **Decided: staff click a button, WhatsApp opens with the message ready, they send it from the clinic's own number. Never a message goes out automatically.** No WhatsApp Business API, no connecting of accounts, no SMS gateway. Section 9 has the consequences: no in-app inbox, no delivery receipts, confirmation happens through the link. |
| D4 | Product name and domain | **To be decided.** `PRODUCT` is the placeholder. Needed before step 3.10 (marketing site) and before the booking and confirm links go to real patients. |
| D5 | Botulinum toxin charting in Albania | **Decided: not ours to police.** The Aesthetics pack is product-agnostic. The clinic decides what it stocks and charts, and the clinic carries that responsibility under its own license. We ship the charting, lot tracking and provenance register for whatever they record. The default catalog stays editable and we make no claim about any product's legal status. |


---

## 1. Who the product serves

Four kinds of people touch it. Each phase below names which of them it serves.

| Side | Person | What they need from V1 |
|---|---|---|
| **Operator** (you) | Founder, support, later sales | See every tenant, its plan, its usage and its health. Change plans, extend trials, issue credits. Roll features out gradually. Help a clinic without silently reading patient data. |
| **Client** (clinic) | Owner | Sign up, pick a plan, invite staff, import patients, go live in a week, see money and recalls, export everything, cancel any month. |
| | Practitioner | Today's list, the patient record, charting, notes, consent status, photos. |
| | Reception | Calendar, booking, reminders, the unconfirmed list, the follow-up list, checkout. |
| | Accountant | What was charged, what was paid, what is overdue. No clinical data. |
| **Patient** | Domestic or travelling | Book online, confirm by link, fill forms before arriving, sign consent, later: portal with documents and secure messages. |
| **External** (post-launch) | Facilitator, home-country dentist, lab | Scoped, consent-gated access to one patient or one order. Never clinic-wide. |

---

## 2. What V1 contains

Priority tags match `feature-catalog.md`. "Launch" means the public release at the end of Phase 7.

### 2.1 Base platform (every plan)

| Area | In at launch | After launch |
|---|---|---|
| Calendar | Day and week views, provider + room/chair + device as hard conflicts, working hours, time off, appointment series, statuses, drag to move | Waitlist with auto-offer, multi-location UI |
| Online booking | Public page per clinic, embeddable widget, service and provider choice, live availability, confirm link, reschedule request | Deposit at booking (arrives with patient payments in Phase 4), Reserve with Google |
| Patients | Profile, contact channels with separate care and marketing consent, structured allergies and conditions with alerts, timeline, documents, photos with per-use consent flags | Patient merge, family links |
| Forms and consent | Form builder, template packs in sq/it/en, forms chained to a service so they send before the visit, click-to-sign with audit trail and hash | QES for high-risk procedures |
| Visits and notes | Visit log, services performed, clinical notes that lock when signed, amendments as new versions | Voice notes, AI scribe |
| Recall engine | Protocols as content, triggers by service, multi-step ladders where each step puts a ready message or a call task in the send queue, stop conditions, snooze, overdue dashboard ranked by expected recovery value, "next visit" decision required at checkout | Reactivation campaigns |
| Messaging | Templates per language chosen by patient language, **send queue** (everything due today, one click each), `wa.me` click-to-send from the clinic's own number, copy-to-clipboard and email as alternatives, every send logged on the timeline, confirm and reschedule links, compliance split enforced in templates | Click-to-call logging |
| Money (thin) | Charges from services, payments recorded (cash, card, transfer), installment plans, debtor aging, push to finance app | Online payments, deposits |
| Reports | Revenue, utilization, no-show rate, recall performance, provider production. CSV export on every table | Custom report builder |
| Access and audit | Roles (owner, practitioner, assistant, reception, accountant), MFA for clinical roles, per-record access log, compliance dashboard | SAML SSO, external collaborator seats |
| Data rights | Full export (ZIP of CSV + files), erasure workflow, retention rules, breach report generator | |
| Languages | Albanian default, English, Italian. Patient-facing text follows the patient's language | Serbian, Macedonian with regional launch |

### 2.2 Vertical packs (one included in every plan, the second is an add-on)

| Dental pack | Aesthetics pack |
|---|---|
| Odontogram (FDI numbering, per-tooth and per-surface, existing / planned / done) | Face and body charting (points, zone, product, lot, volume or units, depth, technique) |
| Phased treatment plans built from the chart | Treatment series and packages with session counting |
| Quotes from the plan: multi-currency, versioned, signable PDF | Before/after photos with capture stencils and side-by-side compare |
| Lab orders with stage tracking | Inventory with lot and expiry, auto-deduct at charting, one-click recall trace |
| Protocols: hygiene 6-month, implant two-stage, post-extraction | Protocols: neuromodulator 3 to 4 months, filler review 2 to 3 weeks, retouch 6 to 18 months, laser series. All editable, none mandatory (D5) |
| Forms: anamnesis, implant consent, extraction consent | Forms: per-treatment consents, photo-use consent, medical screener |
| | Provenance register (supplier, CE, AKBPM status) and practitioner credential tracking against the four permitted specialties |

### 2.3 Add-on modules (after launch)

| Module | Contents | Target |
|---|---|---|
| **Tourism** | Lead pipeline, journey timeline (quote, deposit, trip 1, healing, trip 2, aftercare), travel calendar, travel-window scheduling, patient portal, cross-border deposits, share-abroad flow, facilitator seats | Month 8 to 12 |
| **Imaging** | STL/PLY/OBJ and DICOM upload and in-browser viewers, then Medit Open API | Month 10 to 14 |
| **Marketing** | Segments, campaigns, review requests with routing, referral tracking | Month 12+ |
| **Multi-location** | Location switcher, per-location reports and rosters | When the first chain asks |
| **Public API and webhooks** | For labs, facilitators, the finance app's reverse direction | After product-market fit |

---

## 3. Plans, prices and options

Principles, each taken from a documented competitor complaint: prices are published, billing is monthly, nothing is charged on the clinic's own patients, no payment processor is mandatory, no credit games, export is always available.

### 3.1 Tiers

Prices exclude VAT. Most clinics are VAT-exempt and cannot recover it, so the pricing page shows both figures.

| | **Start** | **Clinic** | **Pro** |
|---|---|---|---|
| Price per month | **€24** (€28.80 with VAT) | **€59** (€70.80) | **€129** (€154.80) |
| Annual prepay | €240 (2 months free) | €590 | €1,290 |
| For | Solo practitioner, new graduate | The typical 2 to 5 chair clinic | Tourism clinics, mixed clinics, small chains |
| Practitioners included | 1 | 5 | 10 |
| Extra practitioner | not available | €9 each | €9 each |
| Staff seats (reception, assistant, accountant) | 2 | unlimited | unlimited |
| Locations | 1 | 1 | 2 |
| Vertical packs | 1 | 1 | both |
| Rooms and devices as calendar resources | no | yes | yes |
| Online booking page | yes | yes | yes, plus custom domain |
| WhatsApp click-to-send with ready messages | unlimited | unlimited | unlimited |
| Send queue with reminders due (48h, 3h) and follow-ups due | yes | yes | yes |
| Recall engine | 3 active protocols, single step | unlimited, multi-step ladders and call tasks | unlimited |
| Forms and e-consent | template packs | packs plus builder | packs plus builder plus QES |
| Finance app connection | no (record payments only) | yes | yes |
| Reports | 2 basic | all 5 | all 5 plus export scheduling |
| Audit log retention visible in app | 90 days | 2 years | full |
| Storage | 5 GB | 50 GB | 250 GB |
| Support | email, 2 working days | WhatsApp and email, next working day | priority, same day, onboarding call |
| Tourism module (when it ships) | not available | add-on | included |

### 3.2 Add-ons and metered items

| Item | Price | Notes |
|---|---|---|
| Second vertical pack | €19 / month | For mixed dental and aesthetic clinics on Start or Clinic |
| Tourism module | €59 / month on Clinic | Included in Pro |
| Imaging module | €25 / month | Storage billed separately above plan allowance |
| Marketing module | €25 / month | Segments and campaign lists. Sending is still click-to-send, one patient at a time |
| Extra location | €29 / month | |
| Extra storage | €5 per 50 GB | |
| Cross-border deposit rail (Tourism) | 1.2% of the amount, on top of the card processor's fee | Optional. A clinic can always take the deposit by bank transfer and pay nothing |
| Data migration | free for founding clinics, then €150 one-off | CSV is always free and self-serve |

### 3.3 Trial, discounts, lifecycle

- **Trial:** 21 days of the Clinic tier, no card. Demo data is loaded and can be wiped in one click.
- **Founding clinics:** the first 25 get 40% off for life in exchange for a weekly feedback call during beta and a named reference. Recruit dental and aesthetics partners separately so neither vertical dominates the core (`platform-architecture-spec.md` §7).
- **Graduate plan:** Start is free for the first 12 months after a USSH registration date. It is the bottom-up funnel from the 400 to 500 graduates a year. Launch it after the public release, not before.
- **Downgrade and cancel:** any month, in the app, without a call. On cancel the account goes read-only for 60 days with export available, then data is deleted or anonymized per the DPA. This is a selling point, so it goes on the pricing page.
- **Failed payment:** 3 retries over 10 days with email and in-app notice, then read-only, never deletion.

### 3.4 Unit economics check

| | Start | Clinic | Pro |
|---|---|---|---|
| Revenue | €24 | €59 | €129 |
| Messaging | €0 | €0 | €0 |
| Platform share (Supabase, hosting, email, monitoring at about 100 clinics) | €6 | €8 | €12 |
| Card processing (about 3%) | €1 | €2 | €4 |
| Gross margin | about 71% | about 83% | about 88% |

Manual sending removes what `infrastructure-plan.md` §6 called 75% of running cost. At 100 clinics the platform costs roughly $1,000 to $1,500 a month instead of $3,700 to $4,800. The tiers therefore differ by capability (practitioners, rooms and devices, protocol depth, form builder, finance connection, packs, storage, support), not by a message meter.

---

## 4. The two sides of the product

### 4.1 Operator console (you)

A separate app at `admin.PRODUCT` with its own staff table, mandatory MFA and its own audit log. It reads operator tables with a server-side key and never uses a clinic JWT.

| Screen | What it does |
|---|---|
| Tenants | Every clinic: plan, status (trial, active, past due, read-only, cancelled), seats, locations, vertical packs, last login, health score |
| Tenant detail | Subscription and invoices, usage against limits, entitlements with manual overrides, onboarding checklist progress, integration status (WhatsApp, finance app), notes, timeline of plan changes |
| Billing | MRR, new, churned, expansion, trials ending this week, failed payments, credits and refunds |
| Plans and features | Edit plans, prices, limits and feature keys without a deploy. Every change is versioned, and existing subscribers stay on their version until migrated |
| Feature flags | Roll a feature to one clinic, a cohort or a percentage. Kill switch per module |
| Messaging | Send-queue health per clinic: messages prepared, share actually sent, average delay between due and sent. A clinic that stops clicking is a clinic about to churn |
| Support | Inbox, canned replies in Albanian, and **support access** (below) |
| Compliance | Sub-processor register, processing register (Art. 27), breach incidents, DSR queue across tenants, restore-drill log |
| System | Job queues, webhook failures, integration outbox depth, error rates |

**Support access is a product rule, not a convenience.** Operator staff cannot open a patient record by default. A clinic owner grants time-boxed support access (1 hour, 24 hours, 7 days) from their settings. Every read during that window is written to the clinic's own audit log with the staff member's name. This is what Guideline 2/2025 expects of a processor, and it is a line no local competitor can put in a sales deck.

### 4.2 Client lifecycle (the clinic)

| Stage | What happens | Built in |
|---|---|---|
| 1. Sign up | Email, clinic name, vertical, size. Workspace is created, trial starts, demo data loads | Phase 3 |
| 2. Onboarding wizard | Working hours, rooms, services (pick from the vertical catalog and edit prices), staff invites, message language, booking page slug | Phase 3 |
| 3. Compliance capture | License category (II.6.A.3 or II.6.A.5), technical director, practitioner license numbers checked against the USSH register, DPA accepted in-app | Phase 3 |
| 4. Import | CSV or Excel patients with column mapping, duplicate detection and a dry-run report. White-glove for founding clinics | Phase 2 |
| 5. Connect | Finance app and payment account. Both optional. WhatsApp needs no connection: the clinic's phone or WhatsApp Web is enough | Phase 4 |
| 6. Go live | Checklist reaches 100%, the booking page is published, reception sends its first reminder from the queue | |
| 7. Pay | Plan picker, payment method, invoices list, usage meters with warnings at 80% and 100% | Phase 3 |
| 8. Grow | Add a practitioner, a pack, a module. Proration is shown before confirming | Phase 3 |
| 9. Leave | Export, cancel, read-only window, deletion certificate | Phase 3 |

---

## 5. Architecture

### 5.1 Stack

Unchanged from `infrastructure-plan.md`, with the gaps filled in.

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind 4 | Already the demo's stack. **Read `node_modules/next/dist/docs/` before writing Next code**: this version has breaking changes (`clinic/AGENTS.md`) |
| Backend | Supabase Pro, AWS eu-central-1 Frankfurt: Postgres, Auth, Storage, Edge Functions | EEA hosting is an adequacy transfer under Law 124/2024 |
| Data access | SQL-first migrations in git via Supabase CLI, generated TypeScript types, Zod at every boundary, server actions for writes | Keeps RLS as the real boundary |
| Background jobs | **Supabase Queues (pgmq) + pg_cron + Edge Functions** pinned to Frankfurt | Preparing the send queue, advancing recall ladders, the finance outbox and imports need a durable queue. Keeping it inside Postgres keeps patient data in one region and one DPA |
| Files | Supabase Storage private buckets for anything patient-scoped. Cloudflare R2 for heavy scan files when Imaging ships | RLS on `storage.objects`, signed URLs with a TTL of 5 minutes or less |
| PDFs | `@react-pdf/renderer` on the server | Quotes, consents, exports. No headless Chrome to host |
| Email | Postmark (EU) with React Email templates | System email to staff only: invitations, password resets, billing. Patient email is click-to-send like everything else |
| WhatsApp | `wa.me` deep links only. No API, no gateway, no SMS | D3 |
| Payments | Paysera (Albania), Stripe through a UK Ltd (foreign deposits, later foreign subscriptions) | No Stripe for Albanian entities |
| Hosting | Vercel Pro, functions in an EU region | Per-PR previews against staging |
| Monitoring | Sentry (EU data region), Better Stack for uptime and status page | |
| Product analytics | PostHog EU cloud, **session replay off on every clinical route**, no patient identifiers in event properties | Health data must not leak into analytics |
| Secrets | Vercel env for app config, Supabase Vault for anything the database or an Edge Function needs, 1Password for the team | |

### 5.2 Repository

The repo already holds the marketing site at the root and the demo in `clinic/`. Move to a workspace without disturbing the root site:

```
clinic/                     -> becomes the product workspace (pnpm + turborepo)
  apps/
    app/                    clinic app (today's clinic/src moves here)
    admin/                  operator console
    public/                 booking pages, confirm pages, patient portal (no clinic chrome, separate bundle)
  packages/
    db/                     migrations, seed, generated types, RLS tests (pgTAP)
    core/                   pure domain logic: protocols, scheduling, availability, templates, pricing. Today's lib/protocols.ts and lib/whatsapp.ts land here with their tests
    ui/                     design system: globals.css tokens, ui.tsx, viz.tsx, shell
    i18n/                   sq / en / it dictionaries, format helpers, lint for missing keys
    integrations/           finance adapter, messaging drivers, payment drivers
  supabase/                 config, functions/
```

`packages/core` has no database and no React in it. That is what keeps the 18 existing tests valid and makes the scheduling rules testable without a browser.

### 5.3 Tenancy and permissions

- Every tenant table carries `clinic_id`. One schema, RLS-partitioned, as `security-plan.md` §1 specifies.
- `clinic_id`, `role` and `location_ids` are JWT claims written by the Custom Access Token hook from the `memberships` table. Never from user metadata.
- A user who works at two clinics switches the active clinic, which refreshes the token. One token, one clinic.
- Permissions are keys (`patients.read`, `clinical.read`, `clinical.write`, `billing.read`, `settings.manage`, ...) mapped from roles in one SQL function. Policies call `app.has_perm()`, the UI calls the same map.
- Clinical tables add a restrictive policy requiring `aal2`, so a stolen password without the second factor reads nothing clinical.
- Public pages (booking, confirm, portal) never talk to Postgres with the publishable key. They call server routes that validate a token and use the secret key for one narrow query.

### 5.4 Entitlements: how plans become behaviour

One mechanism serves pricing, trials, feature rollout and the operator's manual overrides.

- A **feature key** is a boolean (`calendar.resources`, `forms.builder`, `recall.ladders`, `pack.dental`, `module.tourism`).
- A **limit key** is a number (`practitioners.max`, `messages.auto.monthly`, `storage.gb`, `protocols.active.max`).
- A clinic's entitlements = plan version + add-ons + operator overrides, materialized into `clinic_entitlements` whenever any of them changes.
- The check exists in three places on purpose: the UI (hide or show an upgrade prompt), the server action (refuse), and RLS for the features where bypassing would cost us money or leak a paid module (`app.has_feature('module.tourism')` on tourism tables).
- Limits are enforced softly first. At 80% the owner sees a warning, at 100% the thing being metered stops growing (no new practitioner, no new upload) and everything already there keeps working. A clinic is never cut off from its patients because of a meter.

---

## 6. Database

Conventions for every table unless stated: `id uuid primary key default gen_random_uuid()`, `clinic_id uuid not null`, `created_at`, `updated_at`, `created_by`. Money is an integer in minor units plus a `currency char(3)`. Times are `timestamptz`, displayed in `clinics.timezone`. Localized labels are `jsonb` shaped `{sq, en, it}`. Status fields are `text` with a check constraint, not enums, so adding a value is a one-line migration. Clinical rows are never hard-deleted: they are superseded, and the retention engine anonymizes them when the legal period ends.

### 6.1 The three patterns everything else copies

**Tenant isolation**

```sql
create function app.clinic_id() returns uuid language sql stable
  as $$ select (auth.jwt() ->> 'clinic_id')::uuid $$;

alter table patients enable row level security;

create policy patients_select on patients for select to authenticated
  using (clinic_id = (select app.clinic_id()) and (select app.has_perm('patients.read')));

create policy patients_write on patients for all to authenticated
  using (clinic_id = (select app.clinic_id()) and (select app.has_perm('patients.write')))
  with check (clinic_id = (select app.clinic_id()));

-- clinical tables add this, so a password alone is never enough
create policy clinical_needs_mfa on clinical_notes as restrictive for all to authenticated
  using ((select auth.jwt() ->> 'aal') = 'aal2');
```

Every table ships with a pgTAP test that tries to read and write it with a second clinic's token and with no token. A failing test blocks the merge.

**Double booking is impossible, not warned about**

```sql
create extension if not exists btree_gist;

create table appointment_resources (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references clinics(id),
  appointment_id uuid not null references appointments(id) on delete cascade,
  resource_id uuid not null references resources(id),
  during tstzrange not null,
  active boolean not null default true,        -- false once cancelled or no-show
  exclude using gist (resource_id with =, during with &&) where (active)
);
```

A provider, a chair and a laser are all rows in `resources`. An appointment claims one row per resource it needs. Two overlapping active claims on the same resource cannot be committed, whichever screen, import or API tried. "Reliability is the feature" (`feature-catalog.md` §1) is enforced by the database.

**Audit is append-only and sees reads**

```sql
create table audit_log (
  id bigint generated always as identity,
  clinic_id uuid not null,
  actor_id uuid, actor_kind text,               -- staff | patient | operator | system
  action text not null,                         -- read | create | update | delete | export | share | login
  entity text not null, entity_id uuid,
  patient_id uuid,                              -- denormalized so "who opened this patient" is one index scan
  context jsonb, ip inet, at timestamptz not null default now()
) partition by range (at);
revoke update, delete on audit_log from public;
```

Writes are captured by triggers. Reads of a clinical record go through one data-access function that writes the log row in the same transaction. Monthly partitions keep it fast and make retention a `drop partition`.

### 6.2 Tables by domain

**A. Tenancy and staff**

| Table | Key columns |
|---|---|
| `clinics` | name, legal_name, nipt, verticals[], timezone, default_lang, country, status (trial, active, past_due, read_only, cancelled), trial_ends_at |
| `locations` | clinic_id, name, address, phone, geo, is_default |
| `memberships` | user_id, clinic_id, role, location_ids[], status, invited_by. Source of the JWT claims |
| `staff_profiles` | membership_id, display_name, title, specialties[], verticals[], license_no, license_verified_at, register_source (USSH, Order of Physicians), calendar_color, signature_file_id |
| `invitations` | email, role, token_hash, expires_at, accepted_at |
| `clinic_licenses` | category (II.6.A.3, II.6.A.5), number, technical_director_staff_id, document_file_id, verified_at |
| `clinic_settings` | reminder defaults, booking rules, branding, locale formats, as typed jsonb |

**B. Commercial (operator-owned, clinics read only their own row)**

| Table | Key columns |
|---|---|
| `plans`, `plan_versions` | key, name, version, price_month, price_year, currency, is_public, valid_from |
| `features` | key, kind (flag or limit), description, module |
| `plan_features` | plan_version_id, feature_key, bool_value, int_value |
| `addons`, `addon_prices` | key, feature grants, price, metered flag |
| `subscriptions` | clinic_id, plan_version_id, status, interval, current_period_start and end, cancel_at, billing_provider, provider_ref, discount_id |
| `subscription_items` | subscription_id, addon_id or seat type, quantity |
| `entitlement_overrides` | clinic_id, feature_key, value, reason, expires_at, set_by_operator |
| `clinic_entitlements` | clinic_id, feature_key, bool_value, int_value. Materialized. This is what `app.has_feature()` reads |
| `usage_events`, `usage_counters` | clinic_id, meter (messages.auto, sms, storage.gb, practitioners), quantity, period |
| `billing_invoices`, `billing_payments` | what we charged the clinic, status, external fiscal invoice reference, PDF |
| `discounts` | founding, annual, graduate, manual credit |

**C. Patients**

| Table | Key columns |
|---|---|
| `patients` | first_name, last_name, birth_date, sex, national_id_enc (app-layer encrypted), lang, city, country, is_traveller, source, home_location_id, merged_into_id |
| `patient_channels` | kind (whatsapp, sms, email, phone), value, is_primary, verified_at |
| `patient_consents` | purpose (care_comms, marketing, photo_clinical, photo_marketing, photo_social, share_abroad), status, captured_at, method, evidence_file_id, withdrawn_at. This is the consent registry |
| `patient_medical` | allergies[], conditions[], medications[], pregnancy, notes. Structured so charting can raise an alert |
| `patient_alerts` | severity, text, shown_on (booking, charting, checkout) |
| `timeline_events` | patient_id, kind, ref_table, ref_id, occurred_at, summary jsonb. Written by triggers from every other table. It is the spine the UI renders |

**D. Scheduling**

| Table | Key columns |
|---|---|
| `resources` | location_id, kind (provider, room, chair, device), name, staff_profile_id, bookable_online |
| `working_hours`, `time_off` | resource_id, weekday, start, end / range, reason |
| `services` | vertical, name jsonb, minutes, buffer_minutes, price, currency, deposit_rule jsonb, bookable_online, form_template_ids[], protocol_id |
| `service_requirements` | service_id, resource_kind, count. "Laser hair removal needs one practitioner, one room, one laser" |
| `appointments` | patient_id, location_id, starts_at, ends_at, status (scheduled, arrived, in_treatment, completed, no_show, cancelled), confirmation (pending, sent, confirmed, reschedule), source (staff, online, recall, import), series_id, followup_id, travel_window_id, note |
| `appointment_services` | appointment_id, service_id, price_snapshot |
| `appointment_resources` | the exclusion-constraint table above |
| `appointment_series` | patient_id, treatment_plan_id, rule, pinned_range |
| `waitlist_entries` | patient_id, service_id, earliest, latest, notified_at |
| `booking_pages` | slug, location_id, theme, services[], rules (lead time, max per day), published |
| `booking_requests`, `reschedule_requests` | inbound from public pages, status, handled_by |
| `confirmation_tokens` | token_hash, purpose, target_id, expires_at, used_at, outcome. Store the hash, never the token |

**E. Clinical core**

| Table | Key columns |
|---|---|
| `visits` | patient_id, appointment_id, provider_id, location_id, started_at, ended_at, status |
| `visit_services` | visit_id, service_id, quantity, price_snapshot, tooth_refs[] or zone_refs[] |
| `clinical_notes` | visit_id, body, version, signed_by, signed_at, locked, supersedes_id |
| `treatment_plans`, `treatment_plan_items` | patient_id, title, status; phase_no, service_id, tooth or zone refs, price, status |
| `quotes` | treatment_plan_id, version, currency, fx_rate, total, valid_until, status (draft, sent, accepted, declined, expired), pdf_file_id, signature_id |

**F. Dental pack**

| Table | Key columns |
|---|---|
| `tooth_chart_entries` | patient_id, tooth (FDI), surfaces[], kind (condition or procedure), code, status (existing, planned, completed), visit_id, plan_item_id, recorded_at. History is the list, the current chart is a view over it |
| `lab_orders`, `lab_order_events` | patient_id, lab_name, teeth[], shade, material, due_date; stage, at, by |

**G. Aesthetics pack**

| Table | Key columns |
|---|---|
| `chart_sessions` | visit_id, template (face_front, face_left, face_right, body), notes |
| `chart_points` | session_id, x, y, zone, inventory_item_id, stock_lot_id, amount, unit (ml, units), depth, technique |
| `device_sessions` | visit_id, resource_id, settings jsonb (fluence, pulse, spot), area |
| `treatment_series` | patient_id, service_id, sessions_total, sessions_used, expires_at |

**H. Files and photos**

| Table | Key columns |
|---|---|
| `files` | bucket, path, mime, bytes, sha256, kind, patient_id, uploaded_by, scanned_at |
| `photos` | file_id, patient_id, visit_id, view (stencil key), taken_at, consent_clinical, consent_marketing, consent_social. Any non-clinical query filters on the flag at the database, so unconsented photos cannot even be listed |
| `photo_sets` | patient_id, before_photo_id, after_photo_id, service_id |

**I. Forms and consent**

| Table | Key columns |
|---|---|
| `form_templates` | key, version, vertical, lang, schema jsonb, is_consent, legal_reviewed_at |
| `form_submissions` | template_id and version, patient_id, appointment_id, answers jsonb, status, submitted_at |
| `signatures` | submission_id or quote_id, signer_name, method (click, qes), ip, user_agent, document_sha256, prev_signature_sha256, signed_at. The hash chain is what makes the trail tamper-evident |

**J. Recall**

| Table | Key columns |
|---|---|
| `protocols` | name jsonb, vertical, is_system, cloned_from_id, active |
| `protocol_triggers` | protocol_id, service_id or "time since last visit" |
| `protocol_steps` | protocol_id, order, offset_days, action (message, task, booking_prompt), template_key, channel_order[], stop_on (booked, declined, opted_out) |
| `followups` | patient_id, visit_id, protocol_id, step_id, due_date, status (due, sent, confirmed, declined, booked, done, snoozed, expired), snooze_until, appointment_id, expected_value |
| `followup_attempts` | followup_id, message_id, channel, at, outcome |
| `tasks` | assignee, kind (call, review, book), patient_id, due_at, done_at |

**K. Messaging**

| Table | Key columns |
|---|---|
| `message_templates` | key, channel (whatsapp, email), lang, body, contains_clinical (always false, enforced by a check constraint) |
| `outbound_queue` | patient_id, template_key, rendered_body, reason (booking_confirm, reminder_48h, reminder_3h, followup, reschedule), due_at, appointment_id, followup_id, status (ready, opened, sent, skipped, expired), handled_by. Filled by the job runner. This is the list reception works through |
| `messages` | patient_id, channel, template_key, body, opened_at (the click), marked_sent_at, sent_by, appointment_id, followup_id, token_id. We can know a person clicked. We cannot know WhatsApp delivered it, and the UI never pretends otherwise |
| `reminder_rules` | service_id or default, offsets (48h, 3h) |
| `portal_threads`, `portal_messages` | the only place clinical content may be written to a patient. Post-launch with the portal |

**L. Money (thin by design, see section 7)**

| Table | Key columns |
|---|---|
| `charges` | patient_id, visit_service_id, description, amount, currency, status (open, settled, void) |
| `payments` | patient_id, amount, currency, method (cash, card_pos, transfer, online), status, received_at, provider_ref, received_by |
| `payment_allocations` | payment_id, charge_id, amount |
| `installment_plans`, `installments` | patient_id, total, schedule; due_date, amount, status |
| `payment_intents` | online deposits and payment links, provider, status, return_url |
| `finance_documents` | charge or payment refs, external_id, doc_type (invoice, corrective, receipt), fiscal_nivf, fiscal_nslf, qr_url, pdf_url, status, synced_at. The finance app is the source of truth. We hold a pointer |

**M. Inventory**

| Table | Key columns |
|---|---|
| `suppliers` | name, nipt, contact, documents |
| `inventory_items` | name, kind, unit, vertical, ce_marked, akbpm_registration, min_stock |
| `stock_lots` | item_id, lot_no, expiry, quantity, supplier_id, received_at, provenance_file_id |
| `stock_movements` | lot_id, delta, reason (receive, use, waste, adjust), chart_point_id or visit_id, by. "Which patients received lot X" is one query |

**N. Integrations**

| Table | Key columns |
|---|---|
| `integration_connections` | provider, kind (finance, payments, messaging), status, config, credentials_vault_ref, last_ok_at |
| `integration_outbox` | topic, payload, idempotency_key, attempts, next_attempt_at, status, last_error |
| `webhook_events` | provider, external_id (unique), payload, processed_at. Dedupe on the unique key |
| `import_jobs`, `import_rows` | source, mapping, dry_run, counts, per-row error |

**O. Compliance**

| Table | Key columns |
|---|---|
| `audit_log` | above |
| `access_grants` | grantee (operator staff, external collaborator), scope (clinic, patient, document), expires_at, granted_by, reason |
| `data_requests` | patient_id, kind (export, erasure, rectification), status, due_at, fulfilled_file_id |
| `retention_policies` | entity, years, action (anonymize, delete), legal_basis |
| `transfer_log` | patient_id, recipient, country, legal_basis, prior_information_at, file_ids[]. The Art. 27 record for every share abroad |
| `breach_incidents` | detected_at, nature, categories, counts, measures, notified_controller_at, report_file_id |

**P. Tourism (module, tables created at Phase 8 but reserved now)**
`leads`, `lead_events`, `journeys`, `journey_stages`, `travel_windows`, `travel_segments`, `collaborators`, `affiliate_links`. `travel_windows` is referenced by `appointments` and `appointment_series` from day one so the scheduling engine never needs a rewrite.

**Q. Operator**
`operator_staff`, `operator_audit_log`, `feature_flags`, `flag_targets`, `tenant_notes`, `announcements`, `nps_responses`, `sub_processors`, `processing_register`.

### 6.3 Demo to database map

| Demo type (`lib/demo/types.ts`) | Becomes |
|---|---|
| `Clinic` | `clinics` + `locations` |
| `Provider` + `WorkingHours` | `staff_profiles` + `resources` (kind provider) + `working_hours` |
| `Patient` | `patients` + `patient_channels` + `patient_consents` (`contactConsent` becomes the `care_comms` row) |
| `Treatment` | `services` + `protocol_triggers` |
| `Protocol`, `ProtocolStep` | `protocols`, `protocol_steps` |
| `Appointment` | `appointments` + `appointment_services` + `appointment_resources` |
| `Visit` | `visits` + `visit_services` |
| `FollowUp` | `followups` + `followup_attempts` |
| `Message`, `MessageTemplate` | `messages`, `message_templates` |
| `ConfirmToken` | `confirmation_tokens` (hash stored) |
| `state.now` (demo clock) | Stays in the demo environment only, behind a flag. Production reads the server clock in one place, `core/clock.ts`, so tests can still freeze time |

---

## 7. Finance: integrate, do not build

The boundary, stated once so nobody blurs it later:

| We own | The finance app owns |
|---|---|
| Service catalog and prices | Chart of accounts, VAT logic |
| Treatment plans and quotes | The legal invoice, its number and its PDF |
| Charges created when a service is performed | Fiscalization: NSLF generation, NIVF from the CIS, QR, the 48-hour offline queue, corrective invoices |
| Payments as the front desk records them | The cash register (TCR), cash deposits, Z-reports |
| Installment plans and debtor aging | Bookkeeping, exports for the accountant |
| The patient-facing receipt view, which links to the fiscal document | The clinic's AKSHI certificate |

### 7.1 The adapter contract

`packages/integrations/finance` exposes one interface. Each finance app is a driver behind it.

| Call | When | Returns |
|---|---|---|
| `connect(credentials)` | Settings, once | connection status, the clinic's business units and operators |
| `syncCatalog(services)` | When a service is created or repriced | external item ids |
| `upsertCustomer(patient)` | First sale to a patient. Sends name and the minimum the invoice legally needs, **never clinical data** | external customer id |
| `createSale(sale)` | Checkout. Lines, amounts, payment method, operator, idempotency key | external id, invoice number, NIVF, NSLF, QR url, PDF url |
| `correctSale(externalId, reason, lines)` | Refund or error. Invoices are never deleted in Albania, only corrected | corrective document refs |
| `getDocument(externalId)` | Patient asks for a copy | PDF |
| webhook `document.updated`, `payment.recorded` | Finance app changes something | we update `finance_documents` and, if needed, `payments` |

### 7.2 Delivery rules

- Every call leaves through `integration_outbox` with an idempotency key, so a retry can never create a second invoice.
- Checkout does not wait for the finance app. The sale is saved, the receipt shows "fiscalizing", and the fiscal codes appear within seconds or after the finance app's own offline queue clears. The front desk is never blocked by a tax server.
- If the connection is down for more than an hour, the owner sees a banner and the operator console shows the outbox depth.
- The description on a fiscal line is the service name from the catalog. No tooth numbers, no diagnosis, no notes ever cross this boundary.

### 7.3 If D1 turns out to be an app with no API

Then V1 ships a structured export (CSV and UBL 2.1) that the clinic imports into the finance app daily, and the adapter stays on the roadmap. It is worse, and it is still a launchable product. Find this out in Phase 0, not Phase 4.

---

## 8. Payments

There are two unrelated money flows. They share no code beyond a provider SDK.

### 8.1 Clinics paying us (subscriptions)

| Item | Plan |
|---|---|
| Seller | Us, from our Albanian company (D2). Invoices in ALL at the Bank of Albania rate on the billing date, fiscalized through the same finance app we integrate. We are our own first customer of the adapter |
| Method | **Credit or debit card only**, saved once and charged automatically each period. Card data never touches our servers: the processor's hosted fields or redirect keep us out of PCI scope beyond SAQ-A |
| Processor | Paysera recurring, or a bank acquirer's recurring/tokenization product. Stripe is not available to an Albanian seller. Criteria for step 0.3: tokenized recurring charges, 3-D Secure handling on renewals, webhooks, settlement in ALL and EUR, fees |
| Engine | Our own small subscription state machine (`subscriptions`, `billing_invoices`), not a provider's billing product, because local recurring APIs are thin. A second driver (Stripe under a UK Ltd) can sit beside it for regional customers later |
| Dunning | 3 retries in 10 days, email and in-app banner, card-update link, then read-only. Never deletion |
| Card expiry | Warn the owner 30 and 7 days before the saved card expires |
| Proration | Upgrades take effect now and are prorated to the day. Downgrades take effect at period end |
| Tax | 20% VAT for Albanian customers. ⚠ Confirm with the accountant how to invoice Kosovo and North Macedonia clinics before regional launch |

### 8.2 Patients paying clinics

| Flow | Rail | Phase |
|---|---|---|
| Front desk records cash, POS card or transfer | none, it is a record | 4 |
| Payment link by email or portal (never a clinical detail in the message) | Paysera, money settles to the **clinic's own** Paysera account | 4 |
| Deposit at online booking | same | 4 |
| Tourist deposit in EUR or GBP from abroad | Stripe Connect under the UK Ltd, clinic as connected account, 1.2% platform fee | 8 |

The clinic is always the merchant. We never hold patient money, which keeps us out of payment-institution licensing and keeps the "no withheld payouts" promise true by construction.

---

## 9. Messaging

**Decided (D3): never a message goes out automatically.** The product writes the message. A person sends it.

### 9.1 How it works

1. The job runner watches appointments and follow-ups. When something becomes due (a booking to confirm, a reminder 48 hours before, a follow-up step) it renders the template in the patient's language, mints the confirm link, and adds a row to the **send queue**.
2. Reception opens the queue: every message due now, newest need first, with the patient, the reason and the full text visible.
3. They click **Dërgo në WhatsApp**. WhatsApp opens (the phone app, the desktop app or WhatsApp Web) on the clinic's own number, in that patient's chat, with the text already typed.
4. They press send in WhatsApp. Back in the app the row is marked sent and the message lands on the patient's timeline. The next row is already in focus, so a morning's reminders take a couple of minutes.
5. The patient taps the link and confirms or asks to reschedule. That is what flips the appointment to confirmed.

Nothing to connect, nothing to approve, no cost per message, and the patient sees the clinic's familiar number.

### 9.2 What this model cannot do, and what replaces it

| Not possible without the API | What we do instead |
|---|---|
| See delivery or read receipts | Log the click and the "marked sent". The confirm link is the proof the patient got it |
| Read replies inside the app | Replies arrive in the clinic's WhatsApp, where staff already live. One-tap buttons on the appointment: mark confirmed, mark reschedule requested |
| Send while nobody is at the desk | The queue shows what is overdue to send and for how long. The dashboard tile counts it. An unsent 3h reminder expires on its own instead of going out late |
| Bulk send | Deliberately absent. One patient, one click |

### 9.3 Rules

| Rule | Detail |
|---|---|
| WhatsApp carries scheduling text and links only | Guideline 2/2025. Enforced by the `contains_clinical` check and a template linter that rejects placeholders outside an allow-list (name, date, time, provider, clinic, address, link) |
| Consent | No queue row is created for a patient without `care_comms` consent. The row shows why if staff look for it |
| Opt-out | Staff record it on the patient in one tap. Queue rows stop |
| Expiry | Every queue row has a point after which sending it would be wrong (a 3h reminder at the appointment time). It expires rather than lingering |
| Rhythm | ⚠ WhatsApp can restrict ordinary numbers that send many near-identical messages to people who have not saved them. Templates vary by patient and appointment, the queue is worked through the day rather than in one burst, and onboarding tells clinics to use a WhatsApp Business app number |

If the product ever needs unattended sending, the templates, queue and log above are exactly what an API driver would consume. It would be an added mode, not a rebuild. It is not in this plan.

## 10. Security and compliance as a workstream

The technical controls are in `security-plan.md`. This is the order they land in, and the non-code work around them.

| When | Item |
|---|---|
| Phase 0 | Sign the Supabase DPA. Open the sub-processor register and the processing register. Engage a lawyer for the clinic DPA, the terms and the privacy notice. Ask the Commissioner about the DPO threshold. Get written confirmation from Supabase on PITR and WAL region |
| Phase 1 | RLS on every table with cross-tenant tests as a merge gate. MFA. Audit log. Staging uses synthetic data only. Secret scanning and dependency audit in CI |
| Phase 2 | Private buckets, signed URL TTL of 5 minutes or less, EXIF GPS stripping, virus scan on public uploads. Consent registry. Template linter |
| Phase 3 | Support access grants. Operator audit log. In-app DPA acceptance. Export and erasure workflows |
| Phase 6 | PITR on. First restore drill. External penetration test. DPIA pack assembled from this plan plus audit evidence (mandatory from about 17 January 2027, so being ready early is a sales line). DPO appointed and published. Breach runbook rehearsed once |
| Launch | Status page. Incident templates. Log drain to an EEA store so logs outlive the 7-day native retention |
| Ongoing | Quarterly access review and restore drill. Deploys outside clinic hours (08:00 to 20:00 Tirana) with instant rollback |

---

## 11. Tools and accounts

| Purpose | Tool | Monthly cost at beta | Set up in |
|---|---|---|---|
| Database, auth, storage, functions, queues | Supabase Pro + Small compute + PITR | about $140 | Phase 0 (PITR at Phase 6) |
| Hosting | Vercel Pro | $20 per seat | 0 |
| DNS, WAF, later R2 | Cloudflare | free, then usage | 0 |
| Email | Postmark | about $15 | 1 |
| Payments | Card processor for subscriptions and patient payments: Paysera or a bank acquirer. Later Stripe under a UK Ltd for foreign deposits | per transaction | 0 (choose and apply), 3 and 4 (build) |
| Finance | The app from D1, test environment | per clinic, pass-through | 0 |
| Errors | Sentry Team, EU region | $26 | 1 |
| Uptime and status page | Better Stack | $29 | 6 |
| Product analytics and flags | PostHog EU | free tier at this scale | 3 |
| Support inbox | Crisp or Plain, plus a WhatsApp Business number for support | $0 to $25 | 6 |
| Help center | Docs site in the repo (Nextra or Mintlify), Albanian first | $0 | 6 |
| CI | GitHub Actions | included | 1 |
| Tests | Vitest, Playwright, pgTAP through `supabase test db` | | 1 |
| Design | Figma, with the token set mirrored from `globals.css` | existing | 1 |
| Team secrets | 1Password | about $20 | 0 |
| Legal | Albanian counsel for DPA, terms, privacy, DPIA review | one-off | 0 |
| Accounting | Accountant for the shpk and the UK Ltd | | 0 |

Running cost at beta with 10 to 25 clinics is roughly $250 a month. With no messaging bill, 100 clinics cost roughly $1,000 to $1,500, most of it the Supabase Team plan ($599) once that becomes the right call.

---

## 12. The build, step by step

Estimates assume one or two people building full time with AI assistance, and you deciding quickly. Phases overlap where the step list says so. Every step ends the same way: migration plus RLS tests, `tsc`, `eslint`, `vitest`, `build`, a Playwright walkthrough of the new flow, and a commit.

### Phase 0: decisions and foundations (weeks 1 to 2)

Runs alongside Phase 1. Almost none of it is code, and the merchant account and the lawyer have waiting time, which is why it starts first.

| Step | Work | Done when |
|---|---|---|
| 0.1 | Answer D1 (finance app) and D4 (name and domain). D2, D3, D5 are decided | Written into this file |
| 0.2 | Finance app: get API docs, a test account and white-label terms. Make one test sale end to end by hand | A fiscalized test invoice exists |
| 0.3 | Choose the card processor (Paysera recurring against Raiffeisen and BKT acquiring) and apply for the merchant account. Register the product domain once D4 is set | Merchant application submitted |
| 0.4 | Create Supabase (Frankfurt), Vercel, Cloudflare, Sentry, Postmark, 1Password. Sign the Supabase DPA | Accounts exist, MFA on every one |
| 0.5 | Brief the lawyer: clinic DPA, terms, privacy notice, DPO question, wet-ink consent question, record retention periods | Engagement letter signed |
| 0.7 | Recruit the first 5 founding clinics: 3 dental (at least 1 tourism-heavy), 2 aesthetics | 5 signed letters of intent |

### Phase 1: platform spine (weeks 2 to 6)

Serves: nobody visibly. Everything after depends on it.

| Step | Work | Done when |
|---|---|---|
| 1.1 | Convert `clinic/` to the workspace in section 5.2. Move tokens, `ui.tsx`, `viz.tsx` and shell into `packages/ui`, logic and tests into `packages/core` | App runs unchanged, 18 tests pass from their new home |
| 1.2 | Update `CLAUDE.md`: the visual conventions in it describe the old design. Replace them with the system in `globals.css` | File matches the code |
| 1.3 | Supabase local stack, migration tooling, type generation, seed script that reproduces the demo clinic | `supabase db reset` gives a working demo |
| 1.4 | Schema domains A, C, D (core), J, K plus the three patterns in 6.1 | pgTAP cross-tenant suite green |
| 1.5 | Auth: email and password, TOTP MFA, invitations, access token hook writing claims, clinic switcher | Two test clinics cannot see each other in the browser or by API |
| 1.6 | Permission map and role-aware navigation. Accountant sees no clinical route | Playwright role matrix passes |
| 1.7 | Replace `store.tsx` with a data layer exposing the same selectors (`appointmentsOn`, `patientById`, ...) over Supabase, with optimistic updates | Every demo screen works on real data with no UI change |
| 1.8 | Audit log, triggers, read-logging data-access function, first version of the compliance dashboard | Opening a patient writes a row the owner can see |
| 1.9 | Add Italian to the staff UI. i18n lint fails the build on a missing key | Three complete dictionaries |
| 1.10 | CI: typecheck, lint, unit, pgTAP, Playwright, Security Advisor lint, secret scan. Preview deploys against staging | Red CI blocks merge |
| 1.11 | Job runner: pgmq queues, pg_cron tick, one Edge Function worker with retry and dead-letter | A scheduled test job survives a worker crash |

### Phase 2: the base product (weeks 6 to 13)

Serves: reception, practitioners, patients.

| Step | Work | Done when |
|---|---|---|
| 2.1 | Resources, service requirements, exclusion constraint, availability search in `packages/core` | Property tests cannot produce a double booking |
| 2.2 | Calendar: rooms and devices, drag to move, time off, series, walk-ins | Reception books a laser session that reserves person, room and machine |
| 2.3 | Patient record: channels, consents, medical profile with alerts, timeline from `timeline_events` | An allergy alert appears at booking and at charting |
| 2.4 | Files and photos: private buckets, upload pipeline, consent flags, camera capture in the browser | A photo without marketing consent cannot be listed by a marketing query |
| 2.5 | Forms: builder, template packs sq/it/en, chain to service, pre-visit link, click-to-sign with hash chain, PDF | Patient signs on their phone before arriving, PDF lands on the timeline |
| 2.6 | Visits, notes with sign and lock, amendments | A signed note cannot be edited, only superseded |
| 2.7 | Recall engine v2: triggers, ladders, call tasks, stop conditions, overdue dashboard ranked by expected value, checkout next-visit decision. Each step creates a send-queue row or a task, never a message | The demo's follow-up flow runs on the job queue: due items appear in the send queue on their own |
| 2.8 | Messaging: queue builder job, send-queue screen with keyboard flow, `wa.me` handoff on phone, desktop and web, mark sent, skip with reason, expiry, email and copy alternatives, template editor with linter, timeline logging | Reception clears 30 due reminders in under 3 minutes, and nothing is sent that a person did not click |
| 2.9 | Online booking app (`apps/public`): page, widget, availability, confirm, reschedule, rate limiting, bot protection | A stranger books a slot at 23:00 and it appears on the calendar |
| 2.10 | Reports: the five, each with CSV export | Numbers match a hand count on seed data |
| 2.11 | Import: CSV and Excel, column mapping, duplicate detection, dry run, rollback | A 3,000-row real clinic export imports cleanly |

### Phase 3: commercial layer and operator console (weeks 11 to 16, overlaps Phase 2)

Serves: you, and the clinic owner as a buyer.

| Step | Work | Done when |
|---|---|---|
| 3.1 | Schema domain B. Plans, versions, features, limits seeded from section 3 | Changing a plan in the database changes the app without a deploy |
| 3.2 | Entitlements: materializer, `app.has_feature()`, server guard, UI guard, upgrade prompts | Start tier cannot create a room resource by any route |
| 3.3 | Usage metering for seats, protocols and storage, with 80% and 100% behaviour | A Start clinic cannot add a second practitioner by any route, and sees the upgrade prompt instead |
| 3.4 | Subscription engine: trial, activate, upgrade, downgrade, cancel, read-only, reactivation | State machine has a test for every transition |
| 3.5 | Card billing: hosted card capture, tokenized recurring charge, 3-D Secure on renewal, webhooks, card-expiry warnings. Our invoices issued through the finance adapter (depends on 4.2) | A test clinic saves a card, is charged, gets a fiscal invoice, and renews next period with nobody touching it |
| 3.6 | Operator console: tenants, tenant detail, billing, plans, flags, messaging, system | You can run the business without opening the database |
| 3.7 | Support access grants and operator audit | Operator cannot open a patient without a live grant, and the clinic sees who did |
| 3.8 | Self-serve sign-up, onboarding wizard, compliance capture, go-live checklist | A new clinic reaches a published booking page in under 30 minutes |
| 3.9 | Account area for the owner: plan, usage, invoices, export, cancel | Cancel works without contacting anyone |
| 3.10 | Marketing site with the published price list, in sq/en/it. Legal pages from counsel | Live on the product domain |

### Phase 4: money and the finance integration (weeks 14 to 18)

Serves: reception, owner, accountant.

| Step | Work | Done when |
|---|---|---|
| 4.1 | Charges, payments, allocations, installments, debtor aging, checkout screen | A visit ends with a balance that is right |
| 4.2 | Finance adapter, first driver, outbox, webhooks, connection UI, failure banner | Checkout produces a fiscal invoice with NIVF and QR on the patient timeline within seconds |
| 4.3 | Corrections and refunds through `correctSale` | A refund creates a corrective document, never a deletion |
| 4.4 | Paysera driver for patient payments: payment links, deposit at booking, per-service deposit rules | A deposit paid online marks the booking `deposit_paid` and appears in the finance app |
| 4.5 | Accountant role views and period exports | Accountant closes a month without asking reception |

### Phase 5: vertical packs, two tracks in parallel (weeks 13 to 22)

Serves: practitioners. Neither track touches core tables. They use the extension points (services, protocols, forms, resources, inventory items).

| Track A: Dental | Track B: Aesthetics |
|---|---|
| 5A.1 Odontogram component and `tooth_chart_entries`, adult and primary dentition | 5B.1 Face and body chart component, `chart_sessions`, `chart_points` |
| 5A.2 Plan builder from the chart, phases | 5B.2 Inventory: items, lots, movements, low-stock and expiry alerts |
| 5A.3 Quotes: multi-currency, versions, PDF, signature, accept to book the series | 5B.3 Select lot at charting, auto-deduct, recall trace report |
| 5A.4 Lab orders and stages | 5B.4 Photo stencils, before/after sets, compare view, consent gating |
| 5A.5 Dental protocol and form packs, reviewed by a dentist | 5B.5 Series and packages with session counting |
| 5A.6 Dental KPIs on the reporting engine | 5B.6 Provenance register, credential tracking against the four permitted specialties, aesthetics protocol and form packs |

Done when: both packs demo on the same build, and one mixed clinic account runs both.

### Phase 6: private beta and hardening (weeks 18 to 26)

Serves: the founding clinics, and future you.

| Step | Work | Done when |
|---|---|---|
| 6.1 | Onboard the first 5 clinics by hand, on real data, with PITR on | 5 clinics use it daily for 2 weeks |
| 6.2 | Weekly feedback loop, public changelog in Albanian | Every clinic hears back within a week on every request |
| 6.3 | Grow to 15 to 25 founding clinics, separated by vertical | Pricing objections collected from at least 15 owners |
| 6.4 | Performance: calendar under 200 ms at 50,000 appointments, RLS indexes reviewed with `explain` | Load test passes |
| 6.5 | Restore drill, penetration test, fixes | Report closed |
| 6.6 | DPIA pack, DPO appointed, breach rehearsal | Counsel signs off |
| 6.7 | Help center: 30 articles and 10 short videos, Albanian first | Support tickets link to articles |
| 6.8 | PWA: installable, camera capture, offline-tolerant read of today's list | Works on a reception tablet and a practitioner's phone |

Exit test for the phase: at least 60% of beta clinics are active weekly, the measured no-show rate has dropped at the clinics that clear their send queue daily, and at least 10 clinics say they would pay the published price.

### Phase 7: public launch (weeks 26 to 30)

| Step | Work |
|---|---|
| 7.1 | Launch checklist in section 14 fully green |
| 7.2 | Founding clinics move to paid at the founding discount. First real invoices |
| 7.3 | Pricing page, sign-up and trial open to everyone |
| 7.4 | Launch timed to the 31 December 2026 POS mandate if the dates allow, otherwise to the January 2027 DPIA date. Both are in `business-case.md` §6 |
| 7.5 | Support hours published, status page live |

### Phase 8: Tourism module (months 8 to 12)

Leads and pipeline, quotes to journey, journey timeline, travel windows on appointment sets, travel calendar, patient portal with secure messages, share-abroad flow with `transfer_log`, Stripe Connect deposits under the UK Ltd, facilitator seats, affiliate links. Ship to 5 tourism-heavy founding clinics first. This is the wedge the business case rests on, so it gets a full beta of its own.

### Phase 9: depth and region (months 12 to 24)

Imaging (file upload and viewers, then Medit Open API, then the 3Shape partner request), Marketing module, waitlist auto-offer, public API and webhooks, multi-location UI, native patient app if the PWA proves limiting, Kosovo and North Macedonia with their own finance adapters and languages, Supabase Team plan.

---

## 13. Quality, release and support

| Topic | Rule |
|---|---|
| Branching | Trunk-based, short branches, every PR gets a preview against staging |
| Test layers | `packages/core` unit and property tests. pgTAP for RLS and constraints. Playwright for the 12 money-or-safety flows (book, move, confirm, consent, sign, chart, checkout, fiscalize, refund, export, erase, cancel subscription) |
| Migrations | Forward-only, reviewed by a second person, expand then contract for anything that renames |
| Releases | Outside 08:00 to 20:00 Tirana. Feature flags for anything risky. Rollback is one click |
| Environments | `dev` local, `staging` with synthetic data only, `prod` Frankfurt |
| Visual checks | Capture with Playwright, never from a hidden preview pane: a hidden pane throttles painting and produces screenshots that look like bugs |
| Support | Albanian, human, by WhatsApp and email. Targets: first reply in 4 working hours on Clinic, same day on Pro. No bot as the first line |
| Incidents | Severity ladder, status page, and the Law 124/2024 path: processor tells the controller immediately, the controller has 72 hours to tell the Commissioner, and the breach-report generator pre-fills their form from the audit log |

---

## 14. Launch readiness checklist

**Product:** all "in at launch" rows in section 2 shipped. Both packs pass a clinician review. Import tested on three real exports. Every screen complete in sq, en and it.
**Commercial:** prices published. Sign-up to paid works without you. Invoices fiscalized. Dunning tested. Cancel and export tested.
**Legal:** terms, privacy notice and clinic DPA from counsel, accepted in-app. Sub-processor list public. DPO named. Processing register current. DPIA pack ready. Cookie notice on the marketing site.
**Security:** cross-tenant tests green on every table. Pen test closed. MFA enforced on clinical roles. PITR on, restore drill done in the last 90 days. Log drain live. Secrets rotated after beta.
**Operations:** status page, on-call rota (even if it is two people), runbooks for messaging outage, finance app outage, database restore and breach. Help center live.
**Go to market:** 3 named reference clinics with quotes. Demo environment with the demo clock kept for sales calls. Comparison page against the quote-only competitors.

---

## 15. What we measure

| Question | Metric |
|---|---|
| Is the business working | MRR, net revenue retention, trial to paid, logo churn, average revenue per clinic, add-on attach rate |
| Does the product do what we sell | No-show rate before and after, recall recovery rate, share of follow-ups booked, confirmations by link, share of the send queue actually sent and how late |
| Are clinics really using it | Weekly active clinics, appointments per clinic per week, share of visits closed through checkout |
| Are we safe | Cross-tenant test count, time to restore, incidents, DSR turnaround |
| Are costs under control | Infrastructure cost as a share of revenue, storage per clinic |
| Are we responsive | First reply time, tickets per clinic per month, time from request to shipped for founding clinics |

---

## 16. Risks specific to this build

| Risk | What we do about it |
|---|---|
| The finance app has a weak or missing API | Learn it in Phase 0. Fallback is the export in 7.3, and V1 still launches |
| Scope is wide for a small team | The phase order is the defence: spine, base, commercial, money, packs. Tourism does not start until clinics are paying. Anything tagged "after launch" in section 2 stays there |
| Reminders depend on a person clicking, so a busy desk skips them | The queue is the first thing reception sees, it is fast to clear, the dashboard counts what is unsent, and the owner's report shows send rate next to no-show rate so the link is visible |
| WhatsApp restricts a clinic's number for repetitive sending | Varied templates, sending through the day, WhatsApp Business app recommended at onboarding. See 9.3 |
| No good recurring-card product for an Albanian seller | Compared in step 0.3 before any billing code is written. Worst case, the subscription engine charges through a payment link emailed each period until a tokenizing acquirer is in place |
| A cross-tenant leak | RLS tests as a merge gate, no secret key in the browser, public pages behind server routes, pen test before launch |
| Clinics will not pay the published price | Beta exit test asks 10 owners directly. The Start tier and annual prepay absorb price sensitivity. Change prices in the operator console, no deploy |
| Aesthetics regulation shifts | The pack is built around legal products and documentation. If botulinum toxin is registered, it is a catalog entry and a protocol, not a rebuild |
| A founder-only team is a single point of failure | Runbooks, 1Password, a second person with production access before the first paying clinic |

---

## 17. The next two weeks

1. You answer D1 (which finance app) and D4 (name and domain).
2. I restructure `clinic/` into the workspace (step 1.1) and bring `CLAUDE.md` in line with the new design (1.2).
3. You start the card-processor merchant application and the lawyer brief. These have the longest waits.
4. I stand up the local Supabase stack and write schema domains A, C and D with their cross-tenant tests (1.3, 1.4).
5. You line up the first 5 founding clinics, 3 dental and 2 aesthetics.
6. We get one fiscalized test invoice out of the finance app by hand, so Phase 4 holds no surprises.
