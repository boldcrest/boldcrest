'use client'

import { Link } from '@/i18n/navigation'
import { motion } from 'framer-motion'

interface NextProjectProps {
  name: string
  slug: { current: string }
}

export default function NextProject({ name, slug }: NextProjectProps) {
  return (
    <section className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="mb-[var(--space-sm)] block text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Next Project
          </span>

          <Link
            href={`/work/${slug.current}`}
            className="group inline-flex items-center gap-4"
          >
            <span className="font-display text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] transition-colors duration-300 group-hover:text-accent">
              {name}
              <span className="text-accent">.</span>
            </span>

            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              className="shrink-0 transition-transform duration-[0.5s] group-hover:translate-x-2"
              style={{
                transitionTimingFunction: 'var(--ease-out-expo)',
              }}
            >
              <path
                d="M8 20h24M24 12l8 8-8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
