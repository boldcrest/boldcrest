# Klinika, demo v0.1

Interactive demo of the clinic platform: patient records, working hours and schedule,
ready-made WhatsApp reminders, and treatment follow-ups the patient confirms with one tap.

Built to be shown to a clinic. Everything is clickable, nothing is a mock-up screenshot,
and no backend or account is needed to run it.

```bash
npm install
npm run dev     # http://localhost:3000
npm test        # protocol engine, message rendering, seed integrity
```

## What to click, in order

The demo opens on **Paneli** (the day panel) for a seeded Tirana clinic with three
clinicians, fourteen patients and a live working week.

1. **Send a reminder.** In *Kërkojnë vëmendje* press **WhatsApp** on an unconfirmed
   booking. The message is written in the patient's own language (Albanian, Italian or
   English), already filled with the date, time, clinician and clinic address, and carries
   a personal confirmation link.
2. **Be the patient.** Press **Hap faqen e pacientit** to open that link the way the patient
   would. Confirm, and watch the clinic tab update to *Konfirmuar* by itself. Reusing a
   spent link cannot confirm twice.
3. **Log a visit.** Open any appointment in *Axhenda e sotme* and press **Regjistro vizitë**.
   Choosing a treatment that has a protocol (implant, filler, hygiene, mesotherapy) creates
   its follow-ups automatically. A toast tells you how many.
4. **Work the follow-up list.** **Ndjekjet** ranks what is due by urgency, not by age.
   Send a confirmation request, let the patient accept it, then **Rezervo terminin** to put
   it into a clinician's real working hours.
5. **Move time.** **Një ditë para** / **Një javë para** in the top bar advances the demo
   clock. Reminders and follow-ups come due as the days pass. The circular arrow resets
   everything.

Language toggle (SQ/EN) and light/dark are in the top bar. Albanian is the default.

## What is real and what is staged

Real behaviour, not faked screens:

- Follow-ups are generated from protocol definitions and visit dates by `src/lib/protocols.ts`.
- Messages are rendered from templates per patient language by `src/lib/whatsapp.ts`.
- **Hap WhatsApp** opens a genuine `wa.me` deep link with the text prefilled, which is exactly
  how a clinic would send it on day one, with no WhatsApp Business API approval and no
  per-message cost.
- Confirmation links are single-use tokens with a 7-day expiry; the patient page is a real
  route (`/konfirmo/[token]`) that works on a phone.
- Scheduling checks clinician working hours and refuses double bookings.
- Clinic and patient tabs stay in sync through the browser's storage events.

Staged for the demo:

- State lives in `localStorage`, not a database. Supabase replaces it without the UI changing
  (see `docs/product/security-plan.md` and `platform-architecture-spec.md` in the repo root).
- There is no login. Roles exist in the data model but every visitor is the owner.
- Nothing is actually sent automatically: the clinic taps send. Automatic delivery through the
  WhatsApp Business API is the same templates behind a settings switch.
- **Cilësimet** shows the treatment catalogue, protocols, message templates and working hours
  as configured data. It is deliberately read-only here rather than pretending to save.

## Compliance built in, not bolted on

Albania's health-data guideline (Udhëzim nr. 2, 30.04.2025) forbids exchanging health data
over personal apps such as WhatsApp. So the messages carry only scheduling text, a treatment
name and a link; anything clinical stays behind the patient page. Patients without contact
consent show *Pa pëlqim kontakti* and cannot be messaged at all.

## Where things live

```
src/lib/demo/types.ts     domain model
src/lib/demo/seed.ts      the seeded clinic, and the message templates
src/lib/demo/store.tsx    state, demo clock, persistence, cross-tab sync
src/lib/protocols.ts      follow-up generation, due dates, priority
src/lib/whatsapp.ts       template rendering, wa.me links, tokens
src/lib/i18n.ts           Albanian and English copy, Albanian date formatting
src/app/(app)/            clinic app: paneli, orari, pacientet, ndjekjet, cilesimet
src/app/konfirmo/[token]/ the patient-facing confirmation page
```

## Next

The base platform in the build plan adds real auth, Supabase with row-level security,
Albanian fiscalization through a certified partner, and automated message delivery.
Dental and aesthetic modules (odontogram, face charting, injectable traceability) and the
dental-tourism journey sit on top of this same core.
