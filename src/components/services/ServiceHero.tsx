'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ServiceHeroProps {
  label: string
  title: string
  subtitle: string
  ctaLabel?: string
  ctaHref?: string
}

export default function ServiceHero({
  label,
  title,
  subtitle,
}: ServiceHeroProps) {
  return (
    <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0">
      <div>
        {/* Breadcrumb — matches the Work detail breadcrumb (ProjectHero) */}
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-tertiary"
        >
          <Link
            href="/services"
            className="transition-colors duration-200 hover:text-white"
          >
            Services
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-text-secondary" aria-current="page">
            {label}
          </span>
        </nav>

        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {label}
        </motion.p>

        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <motion.h1
            className="max-w-[650px] font-display text-[clamp(2rem,4.5vw,3.8rem)] font-bold leading-[1.1] tracking-[-0.03em] text-white"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>

          <motion.p
            className="max-w-[400px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {subtitle}
          </motion.p>
        </div>
      </div>

      {/* Divider */}
      <div className="mt-10 md:mt-12 lg:mt-16">
        <div className="h-px w-full bg-border" />
      </div>
    </section>
  )
}
