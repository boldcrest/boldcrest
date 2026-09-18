# MVP Demo Build Plan — v0.1 "Patient logs, hours, WhatsApp reminders, follow-up confirmations"

**Goal:** a launchable first product with the basics — patients + visit logs, provider hours + appointments, WhatsApp booking reminders with ready messages and confirmation links, and protocol-driven follow-ups the patient confirms — built on `platform-architecture-spec.md` so later modules are additive updates.

**Location:** `clinic/` — standalone Next.js app inside this repo (the root is the Boldcrest marketing site).

## Scope

| Area | In v0.1 | Deferred |
|---|---|---|
| Auth & workspace | Supabase Auth email/password; clinic workspace; roles owner/practitioner/reception; multi-tenant (`clinic_id` + RLS) | SSO, MFA UI, external collaborator seats |
| Patients | List/search, create/edit, WhatsApp number + contact consent, patient timeline (visits, notes, reminders, messages) | Documents/photos, anamnesis forms, odontogram, face charting |
| Visit log | Provider, date, treatments from catalog (dental + aesthetics presets), notes | Charting depth, inventory, quotes |
| Hours & schedule | Provider weekly working hours; day/week calendar; create/move/cancel; statuses booked→confirmed→arrived→done / no-show / cancelled; per-provider conflict detection | Rooms/devices, online booking page, deposits |
| **Booking reminders (WhatsApp)** | Templates (sq/it/en, auto-picked per patient): booking confirmation, 48h reminder, 3h reminder, reschedule notice. Generated with name/date/time/provider/address + **confirm link**. **"Send on WhatsApp"** opens WhatsApp with prefilled text to the patient's number (`wa.me` deep link); message logged on timeline. Public tokenized confirm page (Confirm / Need to reschedule) flips appointment to confirmed; reschedule requests go to a staff queue. **Awaiting-confirmation list** with one-click resend. | Automated sending via WhatsApp Business API (same templates + log; settings toggle), two-way inbox |
| **Follow-ups needing confirmation** | Protocols (trigger treatment → steps with day offsets + template) spawn follow-ups on visit logging. Due follow-up → ready WhatsApp message with confirm link → patient confirms interest → "confirmed, to be booked" → staff books into provider hours. Lifecycle: due → sent → confirmed / declined / no reply → booked → done; snooze; "no reply after N days" flag. | Slot-picking in the link (optional v0.1 decision), escalation ladders, reactivation scoring |
| Dashboard | Today's appointments, unconfirmed bookings, follow-ups due, follow-ups awaiting confirmation, overdue | Revenue/utilization reports |
| Settings | Editable treatment catalog, protocols, message templates, working hours | — |
| Ops | Migrations + demo seed, README (Supabase project, env, Vercel), tests: protocol scheduling, confirmation tokens, RLS isolation | Fiscalization, payments |

**Compliance built in:** WhatsApp messages carry scheduling text + links only (treatment name at most, no clinical content) per Guideline 2/2025; confirmation tokens are single-purpose and expiring; messages logged for audit.

## Why this messaging design for the demo
Zero API approvals, zero per-message cost, works with the clinic's existing WhatsApp number on day one; confirmation links produce real "confirmed" data immediately; the identical templates + message log later drive automated API sending (utility templates) — a settings toggle, not a rebuild.

## Stack
Next.js (App Router, TypeScript, Tailwind), Supabase (Postgres, Auth, RLS; `@supabase/ssr`), server actions + Zod, date-fns, Vitest, SQL RLS tests, Supabase CLI local stack (Docker).

## Data model additions vs. the first plan
`message_templates` (clinic, key, language, body), `messages` (patient, channel, template, rendered body, status, sent_at, related appointment/follow-up), `confirmation_tokens` (token, purpose, target id, expires_at, used_at), `appointments.confirmation_status`, `followups` (protocol step instance with lifecycle status, due date, snooze_until, message/appointment links), `reschedule_requests`.

## Steps (each ends in a commit + push)
0. Scaffold + local Supabase stack (scaffold exists).
1. Schema + RLS + seed (incl. templates, tokens, follow-up lifecycle; demo clinic with presets).
2. Auth + app shell + i18n (sq/it/en).
3. Patients + timeline + visit log.
4. Schedule + working hours.
5. Booking reminders: templates, generator, Send-on-WhatsApp, public confirm page, awaiting-confirmation list.
6. Protocol engine + follow-up confirmations: spawn on treatment, due list, confirm-link flow, lifecycle, snooze.
7. Dashboard, settings, README, verification (typecheck, unit + RLS tests, end-to-end walkthrough with screenshots).

## Definition of done
A clinic signs in, books a patient, sends the ready WhatsApp reminder, the patient confirms via link; the clinic logs a visit with a treatment, the follow-up becomes due, the ready message goes out, the patient confirms, staff books it — all visible on the timeline, with tenant isolation proven by tests.

## Open decisions (defaults in bold)
- Default UI language: **Albanian with English toggle** vs English-first.
- Follow-up confirm link: **simple "yes, book me"** vs two proposed slots the patient picks.
- Reminder timing defaults: **48h + 3h before**.
- Keep existing `clinic/` scaffold: **yes**.
