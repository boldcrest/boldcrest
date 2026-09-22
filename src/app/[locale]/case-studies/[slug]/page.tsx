import { routing } from '@/i18n/routing'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { client } from '@/sanity/lib/client'
import { caseStudyBySlugQuery, allCaseStudySlugsQuery } from '@/sanity/lib/queries'
import CaseStudyArticle, { type CaseStudy } from './CaseStudyArticle'
import JsonLd from '@/components/JsonLd'
import { ogImageFrom, breadcrumbSchema } from '@/lib/seo'

export async function generateStaticParams() {
  const studies = await client.fetch(allCaseStudySlugsQuery)
  // Cross product with the locales — returning slugs alone leaves `locale`
  // unresolved and Next silently drops the route to dynamic rendering.
  return routing.locales.flatMap((locale) =>
    (studies ?? []).map((s: { slug: { current: string } }) => ({
      locale,
      slug: s.slug.current,
    })),
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const { data: study } = await sanityFetch({
    query: caseStudyBySlugQuery,
    params: { slug, locale },
  })

  if (!study) return { title: 'Case Study' }

  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`
  const path = `${prefix}/case-studies/${slug}`
  const description = study.excerpt || `${study.title} — a BoldCrest case study.`
  const ogImage = ogImageFrom(study.coverImage)

  return {
    title: study.title,
    description,
    alternates: { canonical: path },
    // An unlisted case study is reachable by link but must never be indexed.
    // This is the half of the "hidden" story that search engines see; the other
    // half is that it is absent from the index page and the sitemap.
    ...(study.unlisted ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: 'article',
      title: `${study.title} — BoldCrest`,
      description,
      url: path,
      images: [{ url: ogImage, width: 1200, height: 630, alt: study.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${study.title} — BoldCrest`,
      description,
      images: [ogImage],
    },
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  const { data: study } = await sanityFetch({
    query: caseStudyBySlugQuery,
    params: { slug, locale },
  })

  if (!study) notFound()

  const t = await getTranslations({ locale, namespace: 'CaseStudy' })
  const labels = {
    eyebrow: t('eyebrow'),
    reels: t('reels'),
    reelsHint: t('reelsHint'),
    close: t('close'),
    feed: t('feed'),
  }

  return (
    <>
      {/* Breadcrumbs only for a public case study — emitting schema for an
          unlisted one would hand search engines the URL we are hiding. */}
      {!study.unlisted && (
        <JsonLd
          data={breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Case Studies', path: '/case-studies' },
            { name: study.title, path: `/case-studies/${slug}` },
          ])}
        />
      )}
      <CaseStudyArticle study={study as unknown as CaseStudy} labels={labels} />
    </>
  )
}
