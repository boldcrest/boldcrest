import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { allCaseStudiesQuery } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'CaseStudy' })
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: t('indexTitle'),
    description: t('indexDescription'),
    alternates: { canonical: `${prefix}/case-studies` },
    openGraph: {
      title: t('indexTitle'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

interface CaseStudyCard {
  _id: string
  title: string
  slug: { current: string }
  client?: string
  excerpt?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coverImage?: any
  kpi?: { value?: string; label?: string }
}

export default async function CaseStudiesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: 'CaseStudy' })

  // The query already excludes `unlisted` documents, so an in-progress case
  // study never shows up here even once it is published.
  const { data } = await sanityFetch({ query: allCaseStudiesQuery, params: { locale } })
  const studies = (data ?? []) as unknown as CaseStudyCard[]

  return (
    <main className="px-[var(--gutter)] pt-[clamp(7rem,15vh,11rem)] pb-[var(--space-3xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
          {t('eyebrow')}
        </p>
        <h1 className="max-w-[18ch] font-display text-[clamp(2.5rem,7vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.03em]">
          {t('indexHeading')}
          <span className="text-accent">.</span>
        </h1>

        {studies.length === 0 ? (
          <p className="mt-[var(--space-xl)] text-[1rem] text-text-secondary">
            {t('empty')}
          </p>
        ) : (
          <div className="mt-[var(--space-2xl)] grid grid-cols-1 gap-[var(--space-lg)] md:grid-cols-2">
            {studies.map((s) => (
              <Link
                key={s._id}
                href={`/case-studies/${s.slug.current}`}
                className="group block"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] bg-bg-card">
                  {s.coverImage?.asset?._ref && (
                    <Image
                      src={urlFor(s.coverImage).width(1200).height(900).url()}
                      alt={s.title}
                      fill
                      loader={sanityImageLoader}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover grayscale transition-all duration-500 group-hover:scale-[1.03] group-hover:grayscale-0"
                    />
                  )}
                  {/* The number rides on the cover — it is the hook. */}
                  {s.kpi?.value && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent px-6 pb-5 pt-16">
                      <p className="font-display text-[clamp(2rem,5vw,3.5rem)] font-bold leading-none tracking-[-0.03em] text-white">
                        {s.kpi.value}
                      </p>
                      {s.kpi.label && (
                        <p className="mt-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-white/70">
                          {s.kpi.label}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  {s.client && (
                    <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                      {s.client}
                    </p>
                  )}
                  <h2 className="mt-2 font-display text-[clamp(1.1rem,2vw,1.5rem)] font-bold leading-[1.25] tracking-[-0.01em]">
                    {s.title}
                  </h2>
                  {s.excerpt && (
                    <p className="mt-2 line-clamp-2 text-[0.95rem] leading-[1.6] text-text-secondary">
                      {s.excerpt}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
