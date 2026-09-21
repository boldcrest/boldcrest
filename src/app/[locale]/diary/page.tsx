import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allDiaryPostsQuery } from '@/sanity/lib/queries'
import DiaryPageClient from './DiaryPageClient'

export const metadata: Metadata = {
  title: 'Diary',
  alternates: { canonical: '/diary' },
  description:
    'The latest from our world and beyond. Read deeper into what we do, think, and create.',
  openGraph: {
    title: 'Diary — BoldCrest',
    description:
      'The latest from our world and beyond. Read deeper into what we do, think, and create.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
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
