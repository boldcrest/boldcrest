'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

interface ProjectHeroProps {
  name: string
  services?: string[]
  industry?: string
  year?: string
}

export default function ProjectHero({
  name,
  services,
  industry,
  year,
}: ProjectHeroProps) {
  // Meta line below the title: Service · Industry · Year
  const metaLine = [
    services && services.length > 0 ? services.join(', ') : null,
    industry || null,
    year || null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="px-[var(--gutter)] pt-40 pb-[var(--space-xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        {/* Breadcrumb */}
        <motion.nav
          className="mb-[var(--space-md)] flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-tertiary"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            href="/work"
            className="transition-colors duration-200 hover:text-white"
          >
            Work
          </Link>
          <span>/</span>
          <span className="text-text-secondary">{name}</span>
        </motion.nav>

        {/* Title */}
        <motion.h1
          className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.08]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {name}
          <span className="text-accent">.</span>
        </motion.h1>

        {/* Meta — Service · Industry · Year */}
        {metaLine && (
          <motion.p
            className="mt-[var(--space-lg)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {metaLine}
          </motion.p>
        )}
      </div>
    </section>
  )
}
