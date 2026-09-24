/**
 * Meta click-ID (`fbc`) capture — consent-safe.
 *
 * THE PROBLEM. `_fbc` is normally written by Meta's pixel when someone lands on
 * `?fbclid=…`. Our pixel is consent-gated, so at landing it isn't there. By the
 * time the visitor accepts cookies they've navigated on and the `fbclid` is gone
 * from the URL, so `_fbc` is never written — and we send it almost never. That
 * hurts exactly the traffic we pay for: Events Manager reports advertisers who
 * send `fbc` for Lead see a large lift in reported conversions.
 *
 * THE APPROACH. At landing we read `fbclid` out of the URL and keep it in a
 * MODULE VARIABLE. Nothing is written to the device and nothing already stored is
 * read, which is what ePrivacy Art. 5(3) (and Albania's Law 124/2024) actually
 * governs — so this needs no consent, because it is not storage.
 *
 * Only once the visitor ACCEPTS do we turn it into the `_fbc` cookie. On deny
 * the value is dropped and never leaves the browser. That also means the rest of
 * the stack needs no changes: the pixel and `meta-capi.ts` both already read the
 * `_fbc` cookie, so writing it here feeds the browser AND server halves at once.
 *
 * The memory only survives the page session — a hard reload before answering the
 * banner loses it. That's the accepted cost of storing nothing, and it's rare:
 * people answer the banner on the page they landed on.
 */

/** Meta's format: fb.<subdomainIndex>.<creationTimeMs>.<fbclid> */
const FBC_COOKIE = '_fbc'
const NINETY_DAYS_SECONDS = 90 * 24 * 60 * 60

let capturedFbclid: string | null = null
let capturedAt: number | null = null

/**
 * Cookie domain to write on: the registrable domain, so one `_fbc` is shared by
 * www and any vanity subdomain. Returns null for localhost / bare hosts / IPs,
 * where the cookie should stay host-only.
 */
function cookieDomain(hostname: string): string | null {
  if (/^[\d.]+$/.test(hostname)) return null // IPv4
  const labels = hostname.split('.')
  if (labels.length < 2) return null // 'localhost'
  return `.${labels.slice(-2).join('.')}`
}

function hasFbcCookie(): boolean {
  return document.cookie
    .split('; ')
    .some((row) => row.startsWith(`${FBC_COOKIE}=`))
}

/**
 * Read `fbclid` off the current URL into memory. Safe to call on every mount —
 * it only records the FIRST one seen, so an in-site navigation can't clobber the
 * click that actually brought the visitor here.
 */
export function captureFbclid(): void {
  if (typeof window === 'undefined') return
  if (capturedFbclid) return
  try {
    const fbclid = new URLSearchParams(window.location.search).get('fbclid')
    if (!fbclid) return
    capturedFbclid = fbclid
    capturedAt = Date.now()
  } catch {
    // Malformed query string — nothing to capture.
  }
}

/**
 * Turn a captured click ID into the `_fbc` cookie. ONLY call once consent is
 * 'accepted' — this is the step that writes to the device.
 *
 * No-ops when there's nothing captured, or when a `_fbc` already exists (the
 * pixel's own value wins; overwriting it would reset a legitimately newer click).
 */
export function persistFbcOnConsent(): void {
  if (typeof window === 'undefined') return
  if (!capturedFbclid || !capturedAt) return
  if (hasFbcCookie()) return

  // subdomainIndex 1 == the cookie is set on the registrable domain, which is
  // what cookieDomain() below does. Host-only falls back to the same index; Meta
  // treats a mismatch here leniently, and the click ID is the part that matters.
  const value = `fb.1.${capturedAt}.${capturedFbclid}`
  const domain = cookieDomain(window.location.hostname)

  try {
    document.cookie = [
      `${FBC_COOKIE}=${value}`,
      'path=/',
      `max-age=${NINETY_DAYS_SECONDS}`,
      'SameSite=Lax',
      ...(domain ? [`domain=${domain}`] : []),
      ...(window.location.protocol === 'https:' ? ['Secure'] : []),
    ].join('; ')
  } catch {
    // Cookies blocked — nothing more we can do, and nothing breaks.
  }
}

/** Drop the in-memory click ID (called on deny, so it can't be written later). */
export function forgetFbclid(): void {
  capturedFbclid = null
  capturedAt = null
}
