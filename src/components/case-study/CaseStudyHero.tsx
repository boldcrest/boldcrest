'use client'

import { motion } from 'framer-motion'

interface Stat {
  value?: string
  label?: string
}

interface CaseStudyHeroProps {
  client?: string
  title: string
  kpi: { value?: string; label?: string; context?: string }
  stats?: Stat[]
  eyebrow: string
}

/**
 * Case-study hero.
 *
 * Built on the same grammar as every other hero on the site (see the Contact
 * and Work pages): gutter padding with `pt-[120px]`, an uppercase eyebrow, the
 * headline on the left with the accent dot, a supporting block right-aligned to
 * its bottom edge, then the full-width divider. Landscape phones get the
 * `landscape-short:` overrides the rest of the site uses.
 *
 * The number sits in the right-hand slot rather than being the largest thing on
 * the page: the site's hero type tops out around 6rem, and a 13rem figure read
 * as a different website. It still leads the eye — it is the only other thing
 * in the hero carrying the accent dot — but the headline stays the headline.
 *
 * The entrance is a one-shot `animate` rather than a scroll-linked transform —
 * this is above the fold, and scroll-linked values re-read layout every frame,
 * which is what caused the reversal jump on the homepage.
 */
export default function CaseStudyHero({
  client,
  title,
  kpi,
  stats,
  eyebrow,
}: CaseStudyHeroProps) {
  const supporting = (stats ?? []).filter((s) => s.value || s.label)

  return (
    <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0 landscape-short:pt-[5.5rem]">
      <div className="w-full">
        {/* Eyebrow — static, not animated: framer entrances freeze when the tab
            is backgrounded and this is above-the-fold identifying text. */}
        <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {eyebrow}
          {client && (
            <>
              <span className="mx-2 text-text-tertiary">/</span>
              <span className="text-text-secondary">{client}</span>
            </>
          )}
        </p>

        {/* Headline left, the number right-aligned to its bottom. */}
        <motion.div
          className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white landscape-short:text-[2.4rem]">
            {title}
            <span className="text-accent">.</span>
          </h1>

          {kpi.value && (
            <div className="shrink-0 md:max-w-[440px] md:text-right">
              <p className="font-display text-[clamp(2.5rem,5.5vw,4.25rem)] font-bold leading-[1] tracking-[-0.03em] text-white landscape-short:text-[2rem]">
                {kpi.value}
                <span className="text-accent">.</span>
              </p>
              {kpi.label && (
                <p className="mt-3 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  {kpi.label}
                </p>
              )}
              {kpi.context && (
                <p className="mt-4 text-[0.95rem] leading-[1.7] text-text-secondary">
                  {kpi.context}
                </p>
              )}
            </div>
          )}
        </motion.div>

        {/* Divider — same rhythm as the other heroes. */}
        <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />

        {/* Supporting numbers, under the divider so the hero above it stays the
            headline + one figure. */}
        {supporting.length > 0 && (
          <motion.div
            className="grid grid-cols-1 gap-y-8 pt-[var(--space-lg)] sm:grid-cols-3 sm:gap-x-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {supporting.map((s, i) => (
              <div key={i}>
                <p className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.02em] text-text-primary">
                  {s.value}
                </p>
                {s.label && (
                  <p className="mt-1 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                    {s.label}
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </section>
  )
}
