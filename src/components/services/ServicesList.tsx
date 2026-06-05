'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'
import { CTAButton } from '@/components/MagneticButton'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

interface ServiceItem {
  name: string
  href: string
  description: string
}

interface ServicesListProps {
  label?: string
  heading: string
  services: ServiceItem[]
  ctaLabel?: string
}

export default function ServicesList({
  label = 'Services',
  heading,
  services,
  ctaLabel,
}: ServicesListProps) {
  const { open: openStartProject } = useStartProject()
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

        <div className="flex flex-col">
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              className="group border-t border-border/40 py-8 last:border-b"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link href={service.href} className="block">
                <div className="flex items-start justify-between gap-6">
                  <div className="max-w-[700px]">
                    <h3 className="mb-3 font-display text-[clamp(1.2rem,2vw,1.6rem)] font-bold leading-[1.1] tracking-[-0.01em] text-text-primary transition-colors duration-300 group-hover:text-white">
                      {service.name}
                    </h3>
                    <p className="text-[0.82rem] leading-[1.7] text-text-secondary">
                      {service.description}
                    </p>
                  </div>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mt-1 shrink-0 text-text-tertiary transition-all duration-300 group-hover:translate-x-1 group-hover:text-white"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
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
