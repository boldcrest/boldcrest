'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { submitContactForm } from './actions'

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
  'w-full border-b border-border bg-transparent pb-3 text-[1rem] text-white outline-none transition-colors duration-300 placeholder:text-text-tertiary focus:border-white/40'

export default function ContactPageClient({
  contactEmail,
  socialLinks,
}: ContactPageClientProps) {
  const [submitted, setSubmitted] = useState(false)

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const result = await submitContactForm(formData)
      if (result.success) setSubmitted(true)
      return result
    },
    null,
  )

  const socials =
    socialLinks?.map((s) => ({ label: s.platform, href: s.url })) ??
    defaultSocials
  const email = contactEmail || 'info@boldcrest.com'

  return (
    <main className="relative">
      {/* ── Hero ── */}
      <section className="flex flex-col px-[var(--gutter)] pt-40 pb-0">
        <div className="w-full">
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Contact
          </p>

          {/* Headline left, intro right-aligned to its bottom */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              Start with a Hello.
              <br />
              We&apos;ll take it from there.
            </h1>

            <p className="max-w-[440px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right">
              Let&apos;s Talk. It doesn&apos;t matter how big your business is or
              weird your questions are, they&apos;re worth asking, and we will get
              back to you shortly.
            </p>
          </div>

          {/* Divider */}
          <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />
        </div>
      </section>

      {/* ── Info + Form ── */}
      <section className="px-[var(--gutter)] pb-[var(--space-3xl)] pt-[var(--space-2xl)]">
        <div className="grid grid-cols-1 gap-y-16 md:grid-cols-12 md:gap-x-8">
          {/* Left: contact info — indented inward; fills the form's height so the
              last item (Careers) ends level with the SEND button */}
          <div className="flex flex-col gap-[var(--space-xl)] md:col-span-4 md:col-start-3 md:h-full md:justify-between">
            <div>
              <p className={LABEL}>Email</p>
              <a href={`mailto:${email}`} className={VALUE}>
                {email}
              </a>
            </div>

            <div>
              <p className={LABEL}>Location</p>
              <a
                href="https://maps.google.com/?q=41.312222,19.807778"
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
              <p className="mt-5 text-[1.05rem] text-white">
                41°18&apos;44&quot;N, 19°48&apos;28&quot;E
              </p>
            </div>

            <div>
              <p className={LABEL}>Follow Us</p>
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
              <p className={LABEL}>Other</p>
              <Link href="/careers" className={VALUE}>
                Careers
              </Link>
            </div>
          </div>

          {/* Right: form — field lines end inset from the right edge by the same
              amount the left column is indented from the left (symmetric margins) */}
          <div className="md:col-span-4 md:col-start-7">
            {submitted ? (
              <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <h3 className="font-display text-[2rem] font-bold">Message Sent</h3>
                <p className="mt-3 text-[1rem] text-text-secondary">
                  We&apos;ll get back to you shortly.
                </p>
              </div>
            ) : (
              <form action={formAction} className="flex flex-col gap-[var(--space-lg)] md:h-full">
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Full Name*"
                  className={FIELD}
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email*"
                  className={FIELD}
                />
                <input
                  name="company"
                  type="text"
                  placeholder="Company"
                  className={FIELD}
                />
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Message*"
                  className={`${FIELD} resize-none`}
                />
                <div className="mt-2 md:mt-auto">
                  <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex items-center justify-center rounded-[var(--radius-pill)] border px-[1.4rem] py-[0.6rem] text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-text-secondary transition-colors duration-300 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ borderColor: 'rgba(255,255,255,0.45)', backgroundColor: '#000' }}
                  >
                    {isPending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
