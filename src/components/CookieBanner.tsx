'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'boldcrest-cookie-consent'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  // Only show once a choice hasn't been made. Read after mount (avoids
  // SSR/hydration mismatch) and reveal on a short delay so it eases in after
  // the page has settled.
  useEffect(() => {
    let stored: string | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY)
    } catch {
      /* storage blocked — treat as no prior choice */
    }
    if (stored) return
    const t = window.setTimeout(() => setVisible(true), 600)
    return () => window.clearTimeout(t)
  }, [])

  const choose = (value: 'accepted' | 'denied') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      /* storage blocked — dismiss for this session anyway */
    }
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-label="Cookie consent"
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
                One cookie a day ?
              </h2>
              <p className="mt-1 text-[clamp(1rem,1.6vw,1.25rem)] leading-[1.4] text-text-secondary">
                Keeps the glitches away.
              </p>
              <div className="mt-5 flex items-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                <Link
                  href="/privacy-notice"
                  className="transition-colors duration-300 hover:text-white"
                >
                  Privacy Notice
                </Link>
                <span aria-hidden className="text-text-tertiary">
                  |
                </span>
                <Link
                  href="/cookie-policy"
                  className="transition-colors duration-300 hover:text-white"
                >
                  Cookie Policy
                </Link>
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
                Accept
              </button>
              <button
                type="button"
                onClick={() => choose('denied')}
                className="rounded-[var(--radius-pill)] border px-9 py-2.5 text-[0.75rem] font-semibold uppercase tracking-[0.14em] text-text-secondary transition-colors duration-300 hover:text-white"
                style={{ borderColor: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
              >
                Deny
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
