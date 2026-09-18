# MVP Demo Build Plan — v0.1 "Patient logs, hours, protocol reminders"

**Goal:** a launchable first product with the basics — patients + visit logs, provider hours + appointments, and protocol-driven follow-up reminders — built on the architecture in `platform-architecture-spec.md` so later modules (tourism, odontogram, face charting, fiscalization) are additive updates, not rewrites.

**Location:** `clinic/` — standalone Next.js app inside this repo (the root is the Boldcrest marketing site; keeping it separate avoids coupling builds).

## Scope (what v0.1 does)

| Area | In v0.1 | Deferred (later updates) |
|---|---|---|
| Auth & workspace | Email/password sign-in (Supabase Auth); clinic workspace; roles owner/practitioner/reception; invite by email | SSO, MFA enforcement UI, external collaborator seats |
| Patients | List/search, create/edit, consent-to-contact flags, **patient timeline** (visits, notes, reminders, messages) | Documents/photos, anamnesis forms, odontogram, face charting |
| Visit log | Log a visit: provider, date, treatments performed (from a catalog with dental + aesthetics presets), notes | Charting depth, inventory deduction, quotes |
| Hours & schedule | Providers with weekly working hours; day + week calendar; create/move/cancel appointments; statuses (booked → confirmed → arrived → done / no-show / cancelled); conflict detection per provider | Rooms/devices, online booking page, deposits |
| Protocols & reminders | Protocol definitions (trigger treatment → follow-up steps with day offsets + message template); logging a treatment spawns reminders; **Due / overdue dashboard**; actions: mark done, snooze, book appointment; message log with a provider interface (console/log "sender" in v0.1) | Real WhatsApp/SMS sending, escalation ladders, reactivation scoring |
| Dashboard | Today's appointments, reminders due, overdue count, recent visits | Revenue/utilization reports |
| Ops | Migrations + seed, README setup (Supabase project, env, Vercel deploy), RLS tests, unit tests for protocol scheduling | Fiscalization, payments |

Multi-tenant from day one (`clinic_id` on every table + RLS), Albanian/English strings via a small i18n dictionary (sq default, en) so localization is structural, not bolted on.

## Stack

Next.js (App Router, TypeScript, Tailwind), Supabase (Postgres, Auth, RLS; `@supabase/ssr`), server actions + Zod validation, date-fns, Vitest (protocol logic), SQL-based RLS tests, Supabase CLI local stack (Docker) for development and verification.

## Steps (each ends in a commit)

0. **Scaffold** `clinic/` app, Supabase CLI project, local stack running.
1. **Schema + RLS + seed:** clinics, memberships, patients, providers, working_hours, appointments, treatments, visits, visit_treatments, protocols, protocol_steps, reminders, messages, audit_log; RLS policies with JWT `clinic_id` claim via auth hook; seed a demo clinic (dental + aesthetics treatments, protocols, sample patients/appointments).
2. **Auth + app shell:** sign-in, clinic context, role-aware navigation, i18n.
3. **Patients + timeline + visit logging.**
4. **Schedule:** providers/hours settings, day/week calendar, appointment CRUD + status flow + conflict checks.
5. **Protocol engine:** trigger on visit treatments → reminders; due/overdue dashboard; done/snooze/book; message log + sender interface; unit tests.
6. **Dashboard + README + verification:** typecheck, tests, RLS cross-tenant tests, end-to-end walkthrough on local Supabase, screenshots.

## Definition of done for the demo
A clinic can sign in, add a patient, log a visit with a treatment, see the protocol reminders it generated, work the due list, book the follow-up into a provider's hours, and see it all on the patient timeline — with tenant isolation proven by tests.
