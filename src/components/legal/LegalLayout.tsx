import type { ReactNode } from 'react'

/**
 * Shared layout for legal/policy pages. Reuses the Contact hero structure
 * (eyebrow label + large headline left, small meta right, full-width divider)
 * and renders a readable prose body underneath.
 */
const PROSE = [
  'mx-auto w-full max-w-[760px]',
  '[&_h2:first-child]:mt-0',
  '[&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:font-display [&_h2]:text-[clamp(1.4rem,2.6vw,2rem)] [&_h2]:font-bold [&_h2]:tracking-[-0.02em] [&_h2]:text-white',
  '[&_h3]:mt-8 [&_h3]:mb-2 [&_h3]:font-display [&_h3]:text-[1.15rem] [&_h3]:font-semibold [&_h3]:text-white',
  '[&_p]:mb-5 [&_p]:text-[1rem] [&_p]:leading-[1.8] [&_p]:text-text-secondary',
  '[&_ul]:mb-6 [&_ul]:mt-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
  '[&_li]:text-[1rem] [&_li]:leading-[1.7] [&_li]:text-text-secondary [&_li]:marker:text-text-tertiary',
  '[&_a]:text-white [&_a]:underline [&_a]:underline-offset-4 [&_a]:transition-colors [&_a:hover]:text-accent',
  '[&_strong]:font-semibold [&_strong]:text-white',
  '[&_address]:mb-5 [&_address]:not-italic [&_address]:text-[1rem] [&_address]:leading-[1.8] [&_address]:text-text-secondary',
].join(' ')

export default function LegalLayout({
  label,
  title,
  effectiveDate,
  children,
}: {
  label: string
  title: string
  effectiveDate: string
  children: ReactNode
}) {
  return (
    <main className="relative">
      {/* Hero — mirrors the Contact page heading */}
      <section className="flex flex-col px-[var(--gutter)] pt-40 pb-0">
        <div className="w-full">
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {label}
          </p>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white">
              {title}
            </h1>
            <div className="md:text-right">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                Effective Date
              </p>
              <p className="mt-1 text-[0.95rem] text-text-secondary">
                {effectiveDate}
              </p>
            </div>
          </div>
          <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />
        </div>
      </section>

      {/* Body */}
      <section className="px-[var(--gutter)] pb-[var(--space-3xl)] pt-[var(--space-2xl)]">
        <article className={PROSE}>{children}</article>
      </section>
    </main>
  )
}
