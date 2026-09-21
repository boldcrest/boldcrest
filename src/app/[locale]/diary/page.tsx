import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { allDiaryPostsQuery } from '@/sanity/lib/queries'
import DiaryPageClient from './DiaryPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  const tn = await getTranslations({ locale, namespace: 'Nav' })
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: tn('diary'),
    alternates: { canonical: `${prefix}/diary` },
    
    openGraph: {
      title: t('diaryTitle'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export default async function DiaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const { category } = await searchParams
  const { data: posts } = await sanityFetch({ query: allDiaryPostsQuery, params: { locale } })

  return (
    <DiaryPageClient
      posts={posts ?? []}
      initialCategory={typeof category === 'string' ? category : undefined}
    />
  )
}
