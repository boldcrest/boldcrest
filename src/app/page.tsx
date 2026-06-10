import dynamic from 'next/dynamic'
import { sanityFetch } from '@/sanity/lib/live'
import {
  featuredProjectsQuery,
  homepagePartnersQuery,
  allTeamMembersQuery,
  latestDiaryPostsQuery,
  siteSettingsQuery,
} from '@/sanity/lib/queries'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { absolute: 'BoldCrest' },
  description:
    'BoldCrest is a creative agency in Tirana, Albania, building bold brand identities, packaging, photography, video, and campaigns for ambitious brands. Go bold or go unseen.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'BoldCrest',
    description:
      'Bold brand identities, packaging, photography, video, and campaigns for ambitious brands.',
    url: 'https://www.boldcrest.com',
  },
}

const Hero = dynamic(() => import('@/components/home/Hero'))
const SelectedWorks = dynamic(() => import('@/components/home/SelectedWorks'))
const WeDoSection = dynamic(() => import('@/components/home/WeDoSection'))
const SelectedClients = dynamic(
  () => import('@/components/home/SelectedClients')
)
const ServiceCards = dynamic(
  () => import('@/components/home/ServiceCards')
)
const HomeDiary = dynamic(() =>
  import('@/components/home/BottomSections').then((m) => ({ default: m.HomeDiary }))
)
const BottomSections = dynamic(
  () => import('@/components/home/BottomSections')
)
const ColorTransitionZone = dynamic(
  () => import('@/components/home/ColorTransitionZone')
)

export default async function Home() {
  const [projectsResult, partnersResult, membersResult, diaryResult, settingsResult] =
    await Promise.all([
      sanityFetch({ query: featuredProjectsQuery }),
      sanityFetch({ query: homepagePartnersQuery }),
      sanityFetch({ query: allTeamMembersQuery }),
      sanityFetch({ query: latestDiaryPostsQuery }),
      sanityFetch({ query: siteSettingsQuery }),
    ])

  const projects = projectsResult.data ?? []
  const partners = partnersResult.data ?? []
  const members = membersResult.data ?? []
  const diaryPosts = diaryResult.data ?? []
  const settings = settingsResult.data

  return (
    <main className="relative">
      <Hero />
      <SelectedWorks projects={projects} />

      {/* Color transition zone: dark → light → dark */}
      <ColorTransitionZone>
        <WeDoSection />
        <SelectedClients partners={partners} />
        <ServiceCards />
        <HomeDiary diaryPosts={diaryPosts} />
      </ColorTransitionZone>

      {/* Dark sections — outside the transition zone */}
      <BottomSections members={members} />
    </main>
  )
}
