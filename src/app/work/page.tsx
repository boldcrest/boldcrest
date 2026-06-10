import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allProjectsQuery } from '@/sanity/lib/queries'
import WorkPageClient from './WorkPageClient'

export const metadata: Metadata = {
  title: 'Work',
  alternates: { canonical: '/work' },
  description: 'Our creations, skillfully forged through the years.',
  openGraph: {
    title: 'Work — BoldCrest',
    description: 'Our creations, skillfully forged through the years.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; industry?: string }>
}) {
  const [{ data: projects }, params] = await Promise.all([
    sanityFetch({ query: allProjectsQuery }),
    searchParams,
  ])

  return (
    <WorkPageClient
      projects={projects ?? []}
      initialService={params.service}
      initialIndustry={params.industry}
    />
  )
}
