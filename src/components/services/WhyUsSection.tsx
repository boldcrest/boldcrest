'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface WhyUsItem {
  title: string
  description: string
}

interface WhyUsSectionProps {
  label?: string
  heading: string
  items: WhyUsItem[]
  accentColor?: string
}

export default function WhyUsSection({
  label = 'Why Us',
  heading,
  items,
}: WhyUsSectionProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="px-[var(--gutter)] pt-[var(--space-xl)] pb-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {label}
        </motion.p>

        <motion.h2
          className="mb-[var(--space-xl)] max-w-[700px] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        <div className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              className="flex flex-col border-t border-border pt-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.15 + i * 0.07,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <h3 className="mb-3 font-display text-[clamp(1.05rem,1.5vw,1.3rem)] font-bold leading-[1.15] tracking-[-0.01em] text-text-primary">
                {item.title}
              </h3>
              <p className="text-[0.85rem] leading-[1.7] text-text-secondary">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
