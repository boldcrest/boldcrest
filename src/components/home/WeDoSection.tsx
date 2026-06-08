'use client'

import Link from 'next/link'
import ScrollReveal from '@/components/ScrollReveal'
import { InlineButton } from '@/components/MagneticButton'

export default function WeDoSection() {
  return (
    <section className="flex items-center justify-center px-[var(--gutter)] py-[var(--space-xl)]">
      <ScrollReveal>
        {/* Desktop — inline button */}
        <p className="hidden text-center font-display text-[clamp(2.8rem,8vw,8rem)] font-bold leading-[1.05] tracking-[-0.03em] md:block" style={{ color: 'var(--zone-fg)' }}>
          We do many{' '}
          <InlineButton href="/work" label="View All Work" className="!text-white" lineColor="#000000" />{' '}
          things very well.
        </p>

        {/* Mobile — text + full-width button below */}
        <div className="md:hidden">
          <p className="font-display text-[clamp(2.8rem,12vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]" style={{ color: 'var(--zone-fg)' }}>
            We do many things very well.
          </p>
          <Link
            href="/work"
            className="mt-8 flex w-full items-center justify-between rounded-full px-8 py-5 text-[0.85rem] font-semibold uppercase tracking-[0.1em] transition-opacity duration-300 hover:opacity-80"
            style={{ backgroundColor: 'var(--zone-fg)', color: 'var(--zone-bg)' }}
          >
            View All Work
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  )
}
