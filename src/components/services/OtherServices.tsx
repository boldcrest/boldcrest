'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Link from 'next/link'

interface ServiceCard {
  title: string
  href: string
  description: string
  color: string
}

interface OtherServicesProps {
  heading?: string
  services: ServiceCard[]
}

export default function OtherServices({
  heading = 'Explore Our Other Services',
  services,
}: OtherServicesProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-[#272727] px-[var(--gutter)] py-[var(--space-xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.h2
          className="mb-[var(--space-lg)] font-display text-[clamp(1.6rem,3vw,2.4rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        <div className="grid gap-5 md:grid-cols-2">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.7,
                delay: 0.15 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <Link
                href={service.href}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 p-7 transition-all duration-500 hover:border-white/25 md:min-h-[150px]"
              >
                <div>
                  <h3 className="mb-3 font-display text-[clamp(1.4rem,2.5vw,2rem)] font-bold leading-[1.1] tracking-[-0.02em] text-text-primary">
                    {service.title}
                  </h3>
                  <p className="max-w-[400px] text-[0.85rem] leading-[1.6] text-text-secondary">
                    {service.description}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary transition-colors duration-300 group-hover:text-text-primary">
                  <span>Explore</span>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
