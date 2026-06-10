import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allTeamMembersQuery } from '@/sanity/lib/queries'
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

export default async function PeoplePage() {
  const { data: members } = await sanityFetch({ query: allTeamMembersQuery })

  return <PeoplePageClient members={members ?? []} />
}
