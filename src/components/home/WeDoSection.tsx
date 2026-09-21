'use client'

import { Link } from '@/i18n/navigation'
import ScrollReveal from '@/components/ScrollReveal'
import { InlineButton } from '@/components/MagneticButton'
import { useTranslations } from 'next-intl'

export default function WeDoSection() {
  const t = useTranslations('Home')
  // The desktop line carries the button INSIDE the sentence. Translators marked
  // its position with ⟦ ⟧, so split on those instead of hard-coding English
  // fragments — word order around the button differs per language.
  const [before, buttonLabel = '', after = ''] = t('weDo').split(/⟦|⟧/)
  return (
    <section className="flex items-center justify-center px-[var(--gutter)] py-[var(--space-lg)] md:py-[var(--space-xl)]">
      <ScrollReveal>
        {/* Desktop — inline button */}
        <p className="hidden text-center font-display text-[clamp(2.8rem,8vw,8rem)] font-bold leading-[1.05] tracking-[-0.03em] md:block" style={{ color: 'var(--zone-fg)' }}>
          {before}
          <InlineButton href="/work" label={buttonLabel} adaptive />
          {after}
        </p>

        {/* Mobile — text + full-width button below */}
        <div className="md:hidden">
          <p className="font-display text-[clamp(2.8rem,12vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]" style={{ color: 'var(--zone-fg)' }}>
            {t('weDoMobile')}
          </p>
          <Link
            href="/work"
            // Half-width ghost pill — same outlined look as the "Meet the People"
            // button (transparent-on-dark fill, light text, faint border) instead of
            // the old solid white fill.
            className="mt-8 flex w-1/2 items-center justify-between gap-2 whitespace-nowrap rounded-full border px-5 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
            style={{ backgroundColor: 'var(--zone-bg, #0a0a0a)', color: 'var(--zone-contrast, #EDEDED)', borderColor: 'var(--zone-contrast-faint, rgba(237,237,237,0.3))' }}
          >
            {t('viewAllWork')}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </ScrollReveal>
    </section>
  )
}
