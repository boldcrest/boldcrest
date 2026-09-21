'use client'

import { useTranslations } from 'next-intl'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Outcome {
  title: string
  description: string
}

interface OutcomesSectionProps {
  label?: string
  heading: string
  outcomes: Outcome[]
}

export default function OutcomesSection({
  label,
  heading,
  outcomes,
}: OutcomesSectionProps) {
  const tl = useTranslations('Services')
  const sectionLabel = label ?? tl('outcomes')
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="px-[var(--gutter)] py-[var(--space-3xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {sectionLabel}
        </motion.p>

        <motion.h2
          className="mb-[var(--space-xl)] max-w-[700px] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        <div className="grid gap-8 md:grid-cols-3">
          {outcomes.map((outcome, i) => (
            <motion.div
              key={outcome.title}
              className="border-t border-border/40 pt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <h3 className="mb-3 text-[0.9rem] font-semibold text-text-primary">
                {outcome.title}
              </h3>
              <p className="text-[0.82rem] leading-[1.7] text-text-secondary">
                {outcome.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
