import { getTranslations, setRequestLocale } from 'next-intl/server'
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
import { routing } from '@/i18n/routing'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  const path = locale === routing.defaultLocale ? '/' : `/${locale}`

  return {
    title: { absolute: 'BoldCrest' },
    description: t('homeOgDescription'),
    alternates: { canonical: path },
    openGraph: {
      title: 'BoldCrest',
      description: t('homeDescription'),
      url: `https://www.boldcrest.com${path === '/' ? '' : path}`,
    },
  }
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

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const [projectsResult, partnersResult, membersResult, diaryResult, settingsResult] =
    await Promise.all([
      sanityFetch({ query: featuredProjectsQuery, params: { locale } }),
      sanityFetch({ query: homepagePartnersQuery }),
      sanityFetch({ query: allTeamMembersQuery, params: { locale } }),
      sanityFetch({ query: latestDiaryPostsQuery, params: { locale } }),
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
