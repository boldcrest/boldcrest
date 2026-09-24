import 'server-only'
import { createHash } from 'crypto'
import { cookies, headers } from 'next/headers'

/**
 * Meta Conversions API — the server-side half of the Pixel.
 *
 * WHY: the browser pixel is lossy. Safari/iOS tracking prevention caps the
 * `_fbp` cookie, ad blockers drop `fbevents.js` outright, and flaky networks
 * lose the beacon. Those conversions really happened, Meta just never heard
 * about them. CAPI reports the same event from our server, where none of that
 * applies.
 *
 * DEDUPLICATION is the thing to get right. The browser and the server both
 * report the same Lead, so Meta must be able to tell it is ONE conversion.
 * It does that on `event_name` + `event_id`: we generate one id per submission
 * on the client, hand it to `fbq(... , { eventID })` AND send it here. Miss
 * this and every lead is counted twice, which silently corrupts cost-per-lead.
 *
 * CONSENT: this is deliberately gated exactly like the browser pixel. A visitor
 * who denied cookies is not tracked here either — firing CAPI for them would
 * route around the cookie banner, which is precisely what the banner exists to
 * prevent. In practice the client only issues an `event_id` once consent is
 * 'accepted', so no id reaching this module means no event is sent. The win is
 * still real: it recovers ACCEPTED visitors whose browser pixel was blocked.
 *
 * Fails soft in every direction — a missing token, a Meta outage or a bad
 * response must never break a form submission. The lead matters more than the
 * telemetry.
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1559730958885903'
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
// Set temporarily to make events show up in Events Manager → Test Events.
// Leave unset in normal production use.
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const API_VERSION = 'v21.0'
// Identifies this integration to Meta. Without it Events Manager reports the
// connection as "Unknown Integration" and its diagnostics can't attribute
// anything to us. Free-text; Meta only uses it for labelling.
const PARTNER_AGENT = 'boldcrest-nextjs'

/** Meta requires SHA-256 of the normalized value (trimmed + lowercased). */
function hash(value?: string | null): string | null {
  const normalized = (value ?? '').trim().toLowerCase()
  if (!normalized) return null
  return createHash('sha256').update(normalized).digest('hex')
}

/** "Aldo Hako" → ["aldo", "hako"]; single word → first name only. */
function splitName(full?: string): { first?: string; last?: string } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { first: parts[0] }
  return { first: parts[0], last: parts[parts.length - 1] }
}

export interface ServerEventInput {
  /** Meta standard event name, e.g. 'Lead' | 'ViewContent'. */
  eventName: string
  /** Shared with the browser pixel — this is what makes dedup work. */
  eventId: string
  email?: string
  name?: string
  /** Reporting fields. No PII. */
  custom?: Record<string, unknown>
}

export async function sendServerEvent(
  input: ServerEventInput,
): Promise<{ sent: boolean; reason?: string }> {
  if (!ACCESS_TOKEN) {
    // Not provisioned yet — stay quiet rather than logging on every submission.
    return { sent: false, reason: 'no-token' }
  }
  if (!input.eventId) {
    // No id means the client did not have consent (or is an old cached bundle).
    // Sending anyway would both bypass consent and break deduplication.
    return { sent: false, reason: 'no-event-id' }
  }

  try {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()])

    // Meta's own click/browser identifiers — by far the strongest match signals
    // after email. `_fbc` only exists if the visitor arrived from an ad.
    const fbp = cookieStore.get('_fbp')?.value
    const fbc = cookieStore.get('_fbc')?.value

    const userAgent = headerStore.get('user-agent') || undefined
    // x-forwarded-for is a comma-separated chain; the first entry is the client.
    const forwarded = headerStore.get('x-forwarded-for') || ''
    const clientIp = forwarded.split(',')[0].trim() || undefined

    const origin =
      headerStore.get('origin') ||
      (headerStore.get('host') ? `https://${headerStore.get('host')}` : undefined)
    const referer = headerStore.get('referer') || undefined

    const { first, last } = splitName(input.name)

    // Every PII field is hashed; fbp/fbc/ip/user-agent are sent raw by design
    // (Meta's spec — they are not personal identifiers on their own).
    const userData: Record<string, unknown> = {}
    const em = hash(input.email)
    if (em) userData.em = [em]
    const fn = hash(first)
    if (fn) userData.fn = [fn]
    const ln = hash(last)
    if (ln) userData.ln = [ln]
    if (fbp) userData.fbp = fbp
    if (fbc) userData.fbc = fbc
    if (clientIp) userData.client_ip_address = clientIp
    if (userAgent) userData.client_user_agent = userAgent

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: input.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: input.eventId,
          action_source: 'website',
          ...(referer || origin
            ? { event_source_url: referer || origin }
            : {}),
          user_data: userData,
          custom_data: { ...(input.custom ?? {}) },
          partner_agent: PARTNER_AGENT,
        },
      ],
      ...(TEST_EVENT_CODE ? { test_event_code: TEST_EVENT_CODE } : {}),
    }

    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Token in the body, not the query string, so it can't end up in an
        // access log or a proxy trace.
        body: JSON.stringify({ ...payload, access_token: ACCESS_TOKEN }),
      },
    )

    if (!res.ok) {
      console.error(`[meta-capi] ${input.eventName} rejected:`, res.status, await res.text())
      return { sent: false, reason: 'http-error' }
    }
    return { sent: true }
  } catch (err) {
    console.error(`[meta-capi] Unexpected error sending ${input.eventName}:`, err)
    return { sent: false, reason: 'exception' }
  }
}

/** Lead — fired from both form actions. `form` distinguishes the two. */
export function sendLeadEvent(input: {
  eventId: string
  email?: string
  name?: string
  form: string
  custom?: Record<string, unknown>
}) {
  return sendServerEvent({
    eventName: 'Lead',
    eventId: input.eventId,
    email: input.email,
    name: input.name,
    custom: { form: input.form, ...(input.custom ?? {}) },
  })
}

/**
 * ViewContent — a project page was viewed.
 *
 * Added because Events Manager flagged our server as sending ~178 fewer events
 * than the pixel over 7 days, and coverage (not just Lead accuracy) is what its
 * cost-per-result guidance keys on. There's no email to attach here — an anonymous
 * browse — so this leans on fbp/fbc/IP/user-agent, exactly like the pixel does.
 */
export function sendViewContentEvent(input: {
  eventId: string
  custom?: Record<string, unknown>
}) {
  return sendServerEvent({
    eventName: 'ViewContent',
    eventId: input.eventId,
    custom: input.custom,
  })
}
