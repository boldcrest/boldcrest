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
 * Case-study hero — built around the single headline number.
 *
 * The KPI is the loudest thing on the page on purpose: it is the reason the
 * case study exists. Everything else (client, title, context) is sized to sit
 * under it rather than compete with it.
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
    <section className="px-[var(--gutter)] pt-[clamp(7rem,15vh,11rem)] pb-[var(--space-xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        {/* Eyebrow — static, not animated: framer entrances freeze when the tab
            is backgrounded and this is above-the-fold identifying text. */}
        <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {eyebrow}
          {client && (
            <>
              <span className="mx-2 text-text-tertiary">/</span>
              <span className="text-text-secondary">{client}</span>
            </>
          )}
        </p>

        {/* The number */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-display text-[clamp(4.5rem,16vw,13rem)] font-bold leading-[0.95] tracking-[-0.04em] text-text-primary">
            {kpi.value}
            <span className="text-accent">.</span>
          </p>
          {kpi.label && (
            <p className="mt-[var(--space-sm)] max-w-[28ch] font-display text-[clamp(1.25rem,3vw,2rem)] font-bold leading-[1.2] tracking-[-0.02em] text-text-primary">
              {kpi.label}
            </p>
          )}
          {kpi.context && (
            <p className="mt-[var(--space-sm)] max-w-[52ch] text-[1rem] leading-[1.75] text-text-secondary">
              {kpi.context}
            </p>
          )}
        </motion.div>

        {/* Supporting numbers */}
        {supporting.length > 0 && (
          <motion.div
            className="mt-[var(--space-xl)] grid grid-cols-1 gap-[var(--space-md)] border-t border-border pt-[var(--space-lg)] sm:grid-cols-3"
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
                  <p className="mt-1 text-[0.8rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                    {s.label}
                  </p>
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Title reads as the sub-line to the number, not the headline. */}
        <h1 className="mt-[var(--space-xl)] max-w-[24ch] font-display text-[clamp(1.75rem,4.5vw,3.25rem)] font-bold leading-[1.1] tracking-[-0.03em] text-text-primary">
          {title}
        </h1>
      </div>
    </section>
  )
}
