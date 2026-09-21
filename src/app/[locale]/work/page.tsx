import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { allProjectsQuery } from '@/sanity/lib/queries'
import { getVimeoMeta } from '@/lib/vimeo'
import WorkPageClient from './WorkPageClient'

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
    title: tn('work'),
    alternates: { canonical: `${prefix}/work` },
    description: t('workDescription'),
    openGraph: {
      title: t('workTitle'),
      description: t('workDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ service?: string; industry?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [{ data: rawProjects }, filters] = await Promise.all([
    sanityFetch({ query: allProjectsQuery, params: { locale } }),
    searchParams,
  ])

  // For video-cover projects, resolve the Vimeo cover frame so the list-view
  // hover preview (which can't autoplay video) shows the SAME image as the
  // animated card cover instead of the separate still thumbnail. Cached 1wk in
  // getVimeoMeta, and only the handful of video-cover projects trigger a fetch.
  const projects = await Promise.all(
    (rawProjects ?? []).map(async (p: { thumbnailType?: string; thumbnailVideo?: string }) => {
      if (p?.thumbnailType === 'video' && p?.thumbnailVideo) {
        const { poster } = await getVimeoMeta(p.thumbnailVideo)
        return poster ? { ...p, thumbnailPoster: poster } : p
      }
      return p
    }),
  )

  return (
    <WorkPageClient
      projects={projects}
      initialService={filters.service}
      initialIndustry={filters.industry}
    />
  )
}
