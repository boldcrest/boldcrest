'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

interface Outcome {
  title: string
  description: string
}

interface ServiceItem {
  name: string
  description: string
  href?: string
}

interface OutcomesServicesProps {
  outcomesLabel?: string
  outcomesHeading: string
  outcomes: Outcome[]
  servicesLabel?: string
  servicesHeading: string
  services: ServiceItem[]
  accentColor?: string
}

export default function OutcomesServices({
  outcomesLabel = 'Outcomes',
  outcomesHeading,
  outcomes,
  servicesLabel = 'Services',
  servicesHeading,
  services,
  accentColor = '#DA291C',
}: OutcomesServicesProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section ref={ref} className="px-[var(--gutter)] pt-[var(--space-lg)] pb-[var(--space-lg)]">
      <div className="mx-auto grid max-w-[var(--max-width)] gap-10 md:grid-cols-2 md:gap-16">
        {/* LEFT — Outcomes square */}
        <motion.div
          className="flex flex-col md:aspect-square"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {outcomesLabel}
          </p>
          <h2 className="mb-[var(--space-lg)] font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">
            {outcomesHeading}
          </h2>

          <div className="flex flex-1 flex-col gap-6">
            {outcomes.map((outcome, i) => (
              <motion.div
                key={outcome.title}
                className="border-t border-border/40 pt-5"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + i * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <h3 className="mb-3 font-display text-[clamp(1.05rem,1.6vw,1.35rem)] font-bold leading-[1.15] tracking-[-0.01em] text-text-primary">
                  {outcome.title}
                </h3>
                <p className="text-[0.82rem] leading-[1.7] text-text-secondary">
                  {outcome.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT — Services accordion square */}
        <motion.div
          className="flex flex-col md:aspect-square"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {servicesLabel}
          </p>
          <h2 className="mb-[var(--space-lg)] font-display text-[clamp(1.6rem,2.6vw,2.4rem)] font-bold leading-[1.1] tracking-[-0.02em]">
            {servicesHeading}
          </h2>

          <div className="flex flex-1 flex-col overflow-y-auto">
            {services.map((service, i) => {
              const isOpen = openIndex === i
              return (
                <div key={service.name} className="border-t border-border/40 last:border-b">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center justify-between gap-4 py-4 text-left"
                  >
                    <h3
                      className="font-display text-[clamp(1.05rem,1.6vw,1.35rem)] font-bold leading-[1.15] tracking-[-0.01em] transition-colors duration-300"
                      style={{ color: isOpen ? accentColor : undefined }}
                    >
                      {service.name}
                    </h3>
                    {/* plus → × toggle */}
                    <span className="relative h-4 w-4 shrink-0">
                      <span className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-text-tertiary transition-colors duration-300 group-hover:bg-white" />
                      <span
                        className="absolute top-1/2 left-0 h-[1.5px] w-4 -translate-y-1/2 bg-text-tertiary transition-all duration-300 group-hover:bg-white"
                        style={{ transform: `translateY(-50%) rotate(${isOpen ? 0 : 90}deg)` }}
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 text-[0.82rem] leading-[1.7] text-text-secondary">
                          {service.description}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
