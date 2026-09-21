import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allTeamMembersQuery, allYearPhotosQuery } from '@/sanity/lib/queries'
import PeoplePageClient from './PeoplePageClient'

export const metadata: Metadata = {
  title: 'People',
  alternates: { canonical: '/people' },
  description:
    "It's not about us, it's about you. Meet the team behind BoldCrest.",
  openGraph: {
    title: 'People — BoldCrest',
    description:
      "It's not about us, it's about you. Meet the team behind BoldCrest.",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default async function PeoplePage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const [{ data: members }, { data: yearPhotos }] = await Promise.all([
    sanityFetch({ query: allTeamMembersQuery }),
    sanityFetch({ query: allYearPhotosQuery }),
  ])

  return (
    <PeoplePageClient members={members ?? []} yearPhotos={yearPhotos ?? []} />
  )
}
