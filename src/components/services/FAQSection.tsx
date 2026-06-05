'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CTAButton } from '@/components/MagneticButton'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSectionProps {
  label?: string
  heading: string
  items: FAQItem[]
  ctaLabel?: string
  noTopBorder?: boolean
  tightTop?: boolean
  grayBg?: boolean
}

export default function FAQSection({
  label = 'FAQ',
  heading,
  items,
  ctaLabel,
  noTopBorder = false,
  tightTop = false,
  grayBg = false,
}: FAQSectionProps) {
  const { open: openStartProject } = useStartProject()
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const topPad = tightTop ? 'pt-[var(--space-lg)]' : 'pt-[var(--space-3xl)]'
  // Gray band gets symmetric padding so the FAQ sits centered within it
  const padding = grayBg
    ? 'py-[var(--space-2xl)]'
    : `${topPad} pb-[var(--space-3xl)]`

  return (
    <section ref={ref} className={`${noTopBorder ? '' : 'border-t border-border'} ${grayBg ? 'bg-[#1e1e1e]' : ''} px-[var(--gutter)] ${padding}`}>
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
          className="mb-[var(--space-lg)] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        <div>
          {items.map((item, i) => (
            <motion.div
              key={i}
              className="border-t border-border/40 last:border-b"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.5,
                delay: 0.2 + i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <button
                className="flex w-full items-center justify-between py-6 text-left"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="pr-8 text-[1.15rem] font-medium text-text-primary md:text-[1.25rem]">
                  {item.question}
                </span>
                <motion.span
                  className="shrink-0 text-text-tertiary"
                  animate={{ rotate: openIndex === i ? 45 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M9 3v12M3 9h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-6 pr-12 text-[0.85rem] leading-[1.7] text-text-secondary">
                      {item.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {ctaLabel && (
          <div className="mt-[var(--space-xl)]">
            <CTAButton onClick={openStartProject} label={ctaLabel} showArrow />
          </div>
        )}
      </div>
    </section>
  )
}
