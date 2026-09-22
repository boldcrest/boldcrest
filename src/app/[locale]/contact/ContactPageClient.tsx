'use client'

import { useState, useActionState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import Script from 'next/script'
import { submitContactForm } from './actions'
import { trackLead, newMetaEventId } from '@/lib/analytics'
// Global `window.turnstile` type comes from src/types/turnstile.d.ts (picked up
// automatically by the TS program — no import needed for ambient globals).

// Only set once the Cloudflare Turnstile widget has been created (see
// lib/turnstile.ts) — until then the widget simply doesn't render and
// verification is skipped server-side, same graceful-degradation pattern as
// the Resend API key.
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

interface SocialLink {
  platform: string
  url: string
}

interface ContactPageClientProps {
  contactEmail?: string
  socialLinks?: SocialLink[]
}

const defaultSocials = [
  { label: 'Instagram', href: 'https://www.instagram.com/boldcrest/' },
  { label: 'Behance', href: 'https://www.behance.net/boldcrest' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/company/boldcrest/' },
  { label: 'Facebook', href: 'https://www.facebook.com/boldcrest' },
  { label: 'Vimeo', href: 'https://vimeo.com/boldcrest' },
]

const LABEL =
  'mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary'
const VALUE =
  'text-[1.15rem] leading-[1.5] text-white transition-colors duration-300 hover:text-text-secondary'
const FIELD =
  'w-full border-b border-border bg-transparent pb-3 text-[1rem] text-white outline-none transition-colors duration-300 placeholder:text-text-tertiary focus:border-white/40 disabled:cursor-not-allowed disabled:opacity-40'

export default function ContactPageClient({
  contactEmail,
  socialLinks,
}: ContactPageClientProps) {
  const [submitted, setSubmitted] = useState(false)
  // The global `button { … }` reset (globals.css) strips border/colour utilities
  // from <button> elements, so the SEND pill is styled inline and its hover
  // state is driven here to mirror the site's CTA pill ("Start a Project").
  const t = useTranslations('Contact')
  const [sendHover, setSendHover] = useState(false)
  const [refreshHover, setRefreshHover] = useState(false)
  // Uncontrolled form: reset() clears the fields when the visitor chooses to
  // send another message via the refresh control next to the Sent button.
  const formRef = useRef<HTMLFormElement>(null)
  // Fill-time anti-spam signal — see lib/spam-guard.ts. Captured once at mount,
  // not on every render.
  const [renderedAt] = useState(() => Date.now())

  const [state, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      // Shared id for pixel + Conversions API dedup (null without consent).
      const metaEventId = newMetaEventId()
      if (metaEventId) formData.set('meta_event_id', metaEventId)

      const result = await submitContactForm(formData)
      if (result.success) {
        setSubmitted(true)
        trackLead('contact', undefined, metaEventId ?? undefined)
      } else {
        // A real visitor failing Turnstile is rare but should be able to
        // retry — reset the (single-use) token so the widget can issue a
        // fresh one.
        window.turnstile?.reset()
      }
      return result
    },
    null,
  )

  const handleReset = () => {
    formRef.current?.reset()
    window.turnstile?.reset()
    setSubmitted(false)
  }

  const socials =
    socialLinks?.map((s) => ({ label: s.platform, href: s.url })) ??
    defaultSocials
  const email = contactEmail || 'info@boldcrest.com'

  return (
    <main className="relative">
      {TURNSTILE_SITE_KEY && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
      )}
      {/* ── Hero ── */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0 landscape-short:pt-[5.5rem]">
        <div className="w-full">
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {t('eyebrow')}
          </p>

          {/* Headline left, intro right-aligned to its bottom */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white landscape-short:text-[2.4rem]">
              {t('titleLine1')}<span className="text-accent">.</span>
              <br />
              {t('titleLine2')}<span className="text-accent">.</span>
            </h1>

            <p className="max-w-[440px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right">
              {t('intro')}
            </p>
          </div>

          {/* Divider */}
          <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />
        </div>
      </section>

      {/* ── Info + Form ── */}
      <section className="px-[var(--gutter)] pb-10 pt-10 md:pb-[var(--space-3xl)] md:pt-[var(--space-2xl)]">
        <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-8">
          {/* Left: contact info — indented inward. A tight md gap keeps its
              natural height below the form's, so the FORM is the taller cell and
              drives the (compact) row height; this column then stretches to that
              height and distributes its items so the last one (Careers) ends
              level with the bottom of the SEND button. */}
          <div className="flex flex-col gap-[var(--space-lg)] md:col-span-4 md:col-start-3 md:h-full md:justify-between md:gap-[var(--space-md)]">
            <div>
              <p className={LABEL}>{t('email')}</p>
              <a href={`mailto:${email}`} className={VALUE}>
                {email}
              </a>
            </div>

            <div>
              <p className={LABEL}>{t('location')}</p>
              <a
                href="https://g.page/boldcrest"
                target="_blank"
                rel="noopener noreferrer"
                className={`block ${VALUE}`}
              >
                Rr. Prokop Mima,
                <br />
                Olympic Residences, 37/1, 1019
                <br />
                Tirana, Albania
              </a>
              <a
                href="tel:+355695111150"
                className="mt-5 block text-[1.05rem] text-white transition-colors duration-300 hover:text-text-secondary"
              >
                (00) 355 69 511 11 50
              </a>
            </div>

            <div>
              <p className={LABEL}>{t('followUs')}</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[1.05rem] text-white transition-colors duration-300 hover:text-text-secondary"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <p className={LABEL}>{t('other')}</p>
              <a href="https://careers.boldcrest.com" className={VALUE}>
                {t('careers')}
              </a>
            </div>
          </div>

          {/* Right: form — field lines end inset from the right edge by the same
              amount the left column is indented from the left (symmetric margins) */}
          <div className="md:col-span-4 md:col-start-7">
            <form
              ref={formRef}
              action={formAction}
              className="flex flex-col gap-[var(--space-lg)]"
            >
              <input
                name="name"
                type="text"
                required
                disabled={submitted}
                placeholder={t('fullName')}
                aria-label={t('fullName')}
                className={FIELD}
              />
              <input
                name="email"
                type="email"
                required
                disabled={submitted}
                placeholder={t('emailField')}
                aria-label={t('emailAddress')}
                className={FIELD}
              />
              <input
                name="company"
                type="text"
                disabled={submitted}
                placeholder={t('company')}
                aria-label={t('company')}
                className={FIELD}
              />
              <textarea
                name="message"
                required
                disabled={submitted}
                rows={4}
                placeholder={t('message')}
                aria-label={t('message')}
                className={`${FIELD} resize-none`}
              />

              {/* Honeypot — invisible to real visitors, bots fill it in. */}
              <input
                type="text"
                name="_gotcha"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="pointer-events-none absolute left-[-9999px] h-0 w-0 opacity-0"
              />
              <input type="hidden" name="_ts" defaultValue={renderedAt} />

              {TURNSTILE_SITE_KEY && (
                <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} data-theme="dark" />
              )}

              {state && !state.success && (
                <p className="text-[0.85rem] text-text-secondary">{state.error}</p>
              )}

              {/* Send / Sent pill on the left; once sent, a refresh control sits
                  on the right edge (parallel to it) to clear the form and start
                  over. */}
              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isPending || submitted}
                  onMouseEnter={() => setSendHover(true)}
                  onMouseLeave={() => setSendHover(false)}
                  className="inline-flex items-center justify-center rounded-[var(--radius-pill)] px-5 py-[0.55rem] text-[0.7rem] font-semibold uppercase tracking-[0.12em] transition-all duration-[0.5s] disabled:cursor-not-allowed"
                  style={{
                    borderStyle: 'solid',
                    borderWidth: '1px',
                    borderColor:
                      !submitted && sendHover
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.25)',
                    color:
                      !submitted && sendHover ? '#fff' : 'rgba(255,255,255,0.55)',
                    transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                  }}
                >
                  {isPending ? t('sending') : submitted ? t('sent') : t('send')}
                </button>

                {submitted && (
                  <button
                    type="button"
                    onClick={handleReset}
                    aria-label={t('sendAnother')}
                    title={t('sendAnother')}
                    onMouseEnter={() => setRefreshHover(true)}
                    onMouseLeave={() => setRefreshHover(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-[0.5s]"
                    style={{
                      borderStyle: 'solid',
                      borderWidth: '1px',
                      borderColor: refreshHover
                        ? 'rgba(255,255,255,0.6)'
                        : 'rgba(255,255,255,0.25)',
                      color: refreshHover ? '#fff' : 'rgba(255,255,255,0.55)',
                      transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
                    }}
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M23 4v6h-6" />
                      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  )
}
