import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { allTeamMembersQuery, allYearPhotosQuery } from '@/sanity/lib/queries'
import PeoplePageClient from './PeoplePageClient'

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
    title: tn('people'),
    alternates: { canonical: `${prefix}/people` },
    description: t('peopleDescription'),
    openGraph: {
      title: t('peopleTitle'),
      description: t('peopleDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const [{ data: members }, { data: yearPhotos }] = await Promise.all([
    sanityFetch({ query: allTeamMembersQuery, params: { locale } }),
    sanityFetch({ query: allYearPhotosQuery }),
  ])

  return (
    <PeoplePageClient members={members ?? []} yearPhotos={yearPhotos ?? []} />
  )
}
