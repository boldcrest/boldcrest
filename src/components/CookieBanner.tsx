'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion } from 'framer-motion'
import { useFormEmbed } from '@/lib/embed'

const STORAGE_KEY = 'boldcrest-cookie-consent'
const ONE_YEAR = 60 * 60 * 24 * 365

function readCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
  return match ? decodeURIComponent(match.split('=')[1]) : null
}

// True if a choice was made before — on this origin OR (via the apex cookie)
// any other boldcrest.com subdomain.
function hasConsent(): boolean {
  if (readCookie(STORAGE_KEY)) return true
  try {
    return !!window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return false
  }
}

// Persist the choice in a cookie scoped to the apex so ONE decision covers every
// subdomain (www + the careers/branding/… form hosts). localStorage is
// per-origin, which is why the banner used to reappear when crossing from a
// vanity subdomain to www. On localhost / preview hosts we skip the domain
// attribute (host-only cookie). localStorage is also kept as a fallback.
function persistConsent(value: string) {
  const host = window.location.hostname
  const onBoldcrest = host === 'boldcrest.com' || host.endsWith('.boldcrest.com')
  const domain = onBoldcrest ? '; domain=.boldcrest.com' : ''
  try {
    document.cookie = `${STORAGE_KEY}=${value}; path=/; max-age=${ONE_YEAR}; SameSite=Lax${domain}`
  } catch {
    /* cookies blocked */
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* storage blocked */
  }
}

export default function CookieBanner() {
  const tc = useTranslations('Cookie')
  const [visible, setVisible] = useState(false)
  // On a vanity form subdomain, policy links must be absolute to the canonical
  // site (relative paths get rewritten back to the embedded form).
  const { linkBase } = useFormEmbed()

  // Only show when no choice has been made. Read after mount (avoids
  // SSR/hydration mismatch) and reveal on a short delay so it eases in after
  // the page has settled.
  useEffect(() => {
    if (hasConsent()) return
    const t = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(t)
  }, [])

  const choose = (value: 'accepted' | 'denied') => {
    persistConsent(value)
    // Let consent-gated scripts (e.g. GoogleAnalytics) react immediately, so
    // accepting loads them without waiting for a page reload.
    try {
      window.dispatchEvent(new CustomEvent('cookie-consent', { detail: value }))
    } catch {
      /* CustomEvent unsupported */
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label={tc('consent')}
          aria-live="polite"
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[1800] px-[var(--gutter)] pb-[var(--gutter)]"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div
            className="pointer-events-auto flex flex-col gap-6 rounded-[28px] px-7 py-7 sm:px-10 sm:py-8 md:flex-row md:items-center md:justify-between md:gap-10"
            style={{
              backgroundColor: '#141414',
              border: '1px solid var(--border)',
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            {/* Left: copy + policy links */}
            <div className="min-w-0">
              <h2 className="font-display text-[clamp(1.7rem,3.2vw,2.4rem)] font-bold leading-[1.05] tracking-[-0.01em] text-white">
                {tc('line1')}
              </h2>
              <p className="mt-1 text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.4] text-text-secondary">
                {tc('line2')}
              </p>
              <div className="mt-5 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                <a
                  href={`${linkBase}/privacy-notice`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-300 hover:text-white"
                >
                  {tc('privacy')}
                </a>
                <span aria-hidden className="text-text-tertiary">
                  |
                </span>
                <a
                  href={`${linkBase}/cookie-policy`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors duration-300 hover:text-white"
                >
                  {tc('cookies')}
                </a>
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex shrink-0 flex-col gap-3">
              <button
                type="button"
                onClick={() => choose('accepted')}
                className="rounded-[var(--radius-pill)] px-9 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors duration-300"
                style={{ backgroundColor: '#3a3a3a' }}
              >
                {tc('accept')}
              </button>
              <button
                type="button"
                onClick={() => choose('denied')}
                className="rounded-[var(--radius-pill)] border px-9 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text-secondary transition-colors duration-300 hover:text-white"
                style={{ borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
              >
                {tc('deny')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
