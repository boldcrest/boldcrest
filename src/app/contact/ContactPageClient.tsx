'use client'

import { useState, useActionState } from 'react'
import { motion } from 'framer-motion'
import { submitContactForm } from './actions'
import { SubmitButton } from '@/components/MagneticButton'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

interface SocialLink {
  platform: string
  url: string
}

interface ContactPageClientProps {
  contactEmail?: string
  socialLinks?: SocialLink[]
}

const defaultSocials = [
  { label: 'Instagram', href: '#' },
  { label: 'Behance', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'Vimeo', href: '#' },
]

export default function ContactPageClient({
  contactEmail,
  socialLinks,
}: ContactPageClientProps) {
  const { open: openStartProject } = useStartProject()
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

  return (
    <main className="relative">
      {/* ═══════════════════════════════════════════
          HERO — Contact
      ═══════════════════════════════════════════ */}
      <section className="relative px-[var(--gutter)] pt-40 pb-[var(--space-2xl)]">
        <div className="mx-auto max-w-[var(--max-width)]">
          <motion.h1
            className="max-w-[900px] font-display text-[clamp(3rem,8vw,7rem)] font-bold leading-[1.05]"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            Contact<span className="text-accent">.</span>
          </motion.h1>

          <motion.p
            className="mt-[var(--space-lg)] max-w-[650px] text-[1.1rem] leading-[1.7] text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              delay: 0.3,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            Let&apos;s Talk. It doesn&apos;t matter how big your business is or weird your questions are, they&apos;re worth asking, and we will get back to you shortly.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          INFO + FORM — Two-column layout
      ═══════════════════════════════════════════ */}
      <section className="px-[var(--gutter)] pb-[var(--space-3xl)]">
        <div className="mx-auto max-w-[var(--max-width)]">
          <div className="grid gap-[var(--space-2xl)] md:grid-cols-2">
            {/* ── Left Column: Contact Info ── */}
            <motion.div
              className="flex flex-col gap-[var(--space-xl)]"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {/* Social Links */}
              <div>
                <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  Follow Us
                </p>
                <div className="flex flex-wrap gap-4">
                  {socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.9rem] text-text-secondary transition-colors duration-300 hover:text-white"
                    >
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Contact Details */}
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                    Email
                  </p>
                  <a
                    href={`mailto:${contactEmail || 'info@boldcrest.com'}`}
                    className="text-[1rem] text-text-secondary transition-colors duration-300 hover:text-white"
                  >
                    {contactEmail || 'info@boldcrest.com'}
                  </a>
                </div>

                <div>
                  <p className="mb-2 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                    Location
                  </p>
                  <a
                    href="https://maps.google.com/?q=Olympic+Residence+Tirana+Albania"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[1rem] text-text-secondary transition-colors duration-300 hover:text-white"
                  >
                    Olympic Residence, Tirana, Albania
                  </a>
                </div>
              </div>

              {/* Start a Project CTA */}
              <div>
                <p className="mb-3 text-[0.85rem] text-text-tertiary">
                  Have a project in mind?
                </p>
                <button
                  type="button"
                  onClick={openStartProject}
                  className="group inline-flex cursor-pointer items-center gap-2 text-[1rem] font-semibold text-accent transition-colors duration-300 hover:text-white"
                >
                  Start a New Project
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  >
                    <path
                      d="M4 10h12M12 6l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>

            {/* ── Right Column: Simple Contact Form ── */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: 0.5,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
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
                  <h3 className="font-display text-[2rem] font-bold">
                    Message Sent
                  </h3>
                  <p className="mt-3 text-[1rem] text-text-secondary">
                    We&apos;ll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form action={formAction} className="flex flex-col gap-[var(--space-md)]">
                  <div className="border-b border-border pb-4">
                    <input
                      name="name"
                      type="text"
                      required
                      placeholder="Full Name*"
                      className="w-full bg-transparent text-[1rem] text-white placeholder:text-text-tertiary outline-none"
                    />
                  </div>

                  <div className="border-b border-border pb-4">
                    <input
                      name="email"
                      type="email"
                      required
                      placeholder="Email*"
                      className="w-full bg-transparent text-[1rem] text-white placeholder:text-text-tertiary outline-none"
                    />
                  </div>

                  <div className="border-b border-border pb-4">
                    <input
                      name="company"
                      type="text"
                      placeholder="Company"
                      className="w-full bg-transparent text-[1rem] text-white placeholder:text-text-tertiary outline-none"
                    />
                  </div>

                  <div className="border-b border-border pb-4">
                    <textarea
                      name="message"
                      required
                      rows={4}
                      placeholder="Message*"
                      className="w-full resize-none bg-transparent text-[1rem] text-white placeholder:text-text-tertiary outline-none"
                    />
                  </div>

                  <div className="mt-2">
                    <SubmitButton
                      label="Send"
                      pendingLabel="Sending..."
                      isPending={isPending}
                    />
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </main>
  )
}
