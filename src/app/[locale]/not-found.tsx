import type { Metadata } from 'next'
import { CTAButton } from '@/components/MagneticButton'
import { useTranslations } from 'next-intl'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  const t = useTranslations('Error')
  return (
    <main className="relative">
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-10 landscape-short:pt-[5.5rem] md:pb-12">
        <div className="w-full">
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {t('label')}
          </p>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white landscape-short:text-[2.4rem]">
              404
              <br />
              {t('getBackHome')}
            </h1>

            <p className="max-w-[440px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right">
              {t('notFound1')}
              <br />
              {t('notFound2')}
            </p>
          </div>

          <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />

          <div className="mt-10 md:mt-12">
            <CTAButton href="/" label={t('backHome')} showArrow />
          </div>
        </div>
      </section>
    </main>
  )
}
