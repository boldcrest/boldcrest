'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { captureFbclid, persistFbcOnConsent, forgetFbclid } from '@/lib/fbclid'

/* ════════════════════════════════════════════════════
   Meta (Facebook) Pixel — consent-gated

   The pixel sets cookies (_fbp), so — exactly like GoogleAnalytics — it must NOT
   load until the visitor accepts in the cookie banner. It watches the same
   `boldcrest-cookie-consent` value (cookie + localStorage) and the `cookie-consent`
   event the banner dispatches, and only injects fbevents.js once consent ===
   'accepted'. Before any choice / on 'denied', nothing loads and no _fbp is set.

   The Pixel ID is public (it ships in every page's HTML), so it's safe here;
   NEXT_PUBLIC_META_PIXEL_ID can override it without a code change.

   Standard/custom events fire from src/lib/analytics.ts (trackLead → Lead,
   trackStartProject → StartProject, trackViewContent → ViewContent) at the same
   call sites as the GA4 events. `fbq` is undefined until this loads, so those
   calls are no-ops pre-consent.
══════════════════════════════════════════════════════ */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1559730958885903'
const STORAGE_KEY = 'boldcrest-cookie-consent'

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: unknown
  }
}

function readConsent(): 'accepted' | 'denied' | null {
  try {
    const row = document.cookie
      .split('; ')
      .find((r) => r.startsWith(`${STORAGE_KEY}=`))
    const value = row
      ? decodeURIComponent(row.split('=')[1])
      : window.localStorage.getItem(STORAGE_KEY)
    return value === 'accepted' || value === 'denied' ? value : null
  } catch {
    return null
  }
}

export default function MetaPixel() {
  const [consent, setConsent] = useState<'accepted' | 'denied' | null>(null)
  const pathname = usePathname()
  const firstView = useRef(true)

  useEffect(() => {
    // FIRST, before anything else and regardless of consent: lift `fbclid` off
    // the landing URL into memory. This writes nothing and reads nothing from the
    // device, so it is outside ePrivacy Art. 5(3) — but it has to happen now,
    // because by the time the banner is answered the visitor has navigated on and
    // the click ID is gone from the URL. It only becomes a cookie on accept.
    captureFbclid()
    setConsent(readConsent())
    // Banner fires this on Accept/Deny, so the pixel can load (or stay out) live.
    const onConsent = (e: Event) => {
      const value = (e as CustomEvent).detail
      if (value === 'accepted' || value === 'denied') setConsent(value)
    }
    window.addEventListener('cookie-consent', onConsent)
    return () => window.removeEventListener('cookie-consent', onConsent)
  }, [])

  // Consent decision landed. On accept, promote the in-memory click ID to the
  // `_fbc` cookie — from there the pixel and meta-capi.ts both pick it up with no
  // further changes. On deny, drop it so it can never be written.
  useEffect(() => {
    if (consent === 'accepted') persistFbcOnConsent()
    else if (consent === 'denied') forgetFbclid()
  }, [consent])

  // SPA navigations don't reload, so fire PageView on each route change. The
  // inline script already fires the FIRST PageView, so skip the initial run.
  useEffect(() => {
    if (consent !== 'accepted') return
    if (firstView.current) {
      firstView.current = false
      return
    }
    if (typeof window.fbq === 'function') window.fbq('track', 'PageView')
  }, [pathname, consent])

  // No script, no cookie, no network call until the visitor has accepted.
  if (consent !== 'accepted') return null

  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
    </Script>
  )
}
