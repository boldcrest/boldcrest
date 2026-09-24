/* ════════════════════════════════════════════════════
   Lightweight GA4 event helper

   gtag is only present once the visitor accepts cookies (see
   components/GoogleAnalytics.tsx — it loads gtag.js post-consent). So this is a
   no-op when analytics hasn't loaded: no consent → no event, exactly like the
   page-view tag. Safe to call from anywhere on the client.
══════════════════════════════════════════════════════ */

type Gtag = (...args: unknown[]) => void

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  const gtag = (window as unknown as { gtag?: Gtag }).gtag
  if (typeof gtag === 'function') gtag('event', name, params ?? {})
}

// ── Meta (Facebook) Pixel ───────────────────────────────────────────────────
// fbq is only present once the visitor accepts cookies (MetaPixel.tsx loads it
// post-consent), so this is a no-op until then — same gating as gtag above.
type Fbq = (...args: unknown[]) => void

export function metaTrack(
  event: string,
  params?: Record<string, unknown>,
  custom = false,
  /** Shared with the Conversions API so Meta counts ONE conversion, not two.
   *  Passed to fbq as the `eventID` option — the exact spelling matters. */
  eventId?: string,
) {
  if (typeof window === 'undefined') return
  // The pixel loads async (consent-gated + afterInteractive Script), so a
  // mount-time event (ViewContent) can fire before `fbq` exists and be lost.
  // Retry briefly until the stub is defined; give up after ~3s (e.g. consent
  // denied → fbq never loads). Click/submit events find fbq ready on attempt 0.
  const fire = (tries = 0) => {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq
    if (typeof fbq === 'function') {
      if (eventId) {
        fbq(custom ? 'trackCustom' : 'track', event, params ?? {}, { eventID: eventId })
      } else {
        fbq(custom ? 'trackCustom' : 'track', event, params ?? {})
      }
      return
    }
    if (tries < 20) window.setTimeout(() => fire(tries + 1), 150)
  }
  fire()
}

/** A form submission turned into a lead. `form` distinguishes the two forms.
 *  `eventId` must be the SAME id the server sent to the Conversions API for
 *  this submission — that pairing is what stops the lead being double counted.
 *  Mint it with `newMetaEventId()` BEFORE submitting, so it can travel with the
 *  form data. */
export function trackLead(
  form: 'contact' | 'start_project',
  params?: Record<string, unknown>,
  eventId?: string,
) {
  // 'generate_lead' is GA4's recommended event for this; mark it a Key Event in
  // GA4 → Admin → Events to count it as a conversion.
  trackEvent('generate_lead', { form, ...params })
  // Meta standard 'Lead' — usable as a conversion / custom-conversion in Ads.
  metaTrack('Lead', { form, ...params }, false, eventId)
}

/* ── Conversions API pairing ───────────────────────────────────────────────
 * The browser pixel and the server both report a Lead. Meta deduplicates them
 * on event_name + event_id, so both halves must carry the same id.
 *
 * Returns null unless the visitor has ACCEPTED cookies. That is the consent
 * gate for the server side too: no id means the server sends nothing, so a
 * visitor who denied is not tracked by either half. Firing CAPI regardless
 * would route around the cookie banner.
 */
const CONSENT_KEY = 'boldcrest-cookie-consent'

function hasAcceptedCookies(): boolean {
  try {
    const row = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${CONSENT_KEY}=`))
    const value = row
      ? decodeURIComponent(row.split('=')[1])
      : window.localStorage.getItem(CONSENT_KEY)
    return value === 'accepted'
  } catch {
    return false
  }
}

export function newMetaEventId(): string | null {
  if (typeof window === 'undefined') return null
  if (!hasAcceptedCookies()) return null
  try {
    return crypto.randomUUID()
  } catch {
    // Older Safari without randomUUID — any collision-resistant id will do.
    return `bc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  }
}

/** Visitor opened the "Start a Project" chat (clicked any Start-a-Project CTA). */
export function trackStartProject() {
  trackEvent('start_project_open')
  // Custom Meta event — soft intent signal before the Lead (form submit).
  metaTrack('StartProject', undefined, true)
}

/** A portfolio / case-study page was viewed. */
export function trackViewContent(params?: Record<string, unknown>, eventId?: string) {
  trackEvent('view_item', params)
  // Same dedup contract as trackLead: `eventId` must match the id the server
  // sends to the Conversions API for this same page view.
  metaTrack('ViewContent', params, false, eventId)
}
