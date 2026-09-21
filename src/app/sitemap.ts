import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { allProjectsQuery, allDiaryPostsQuery } from '@/sanity/lib/queries'
import { routing } from '@/i18n/routing'
import { sitemapImageFrom } from '@/lib/seo'

const BASE_URL = 'https://www.boldcrest.com'

// Regenerate the sitemap at most hourly so newly published Sanity projects and
// diary posts appear without needing a redeploy. (Without this the route is
// baked at build time and new content is missing until the next deploy.)
export const revalidate = 3600

type SanityImage = { asset?: { _ref?: string } } | null

interface ProjectRow {
  slug: { current: string }
  _updatedAt?: string
  thumbnail?: SanityImage
}

interface DiaryRow {
  slug: { current: string }
  _updatedAt?: string
  publishedAt?: string
  coverImage?: SanityImage
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    client.fetch(allProjectsQuery, { locale: routing.defaultLocale }) as Promise<ProjectRow[]>,
    client.fetch(allDiaryPostsQuery) as Promise<DiaryRow[]>,
  ])

  const projectUrls: MetadataRoute.Sitemap = (projects ?? []).map((p) => {
    const img = sitemapImageFrom(p.thumbnail)
    return {
      url: `${BASE_URL}/work/${p.slug.current}`,
      lastModified: p._updatedAt ? new Date(p._updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      ...(img ? { images: [img] } : {}),
    }
  })

  const diaryUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => {
    const img = sitemapImageFrom(p.coverImage)
    return {
      url: `${BASE_URL}/diary/${p.slug.current}`,
      lastModified: new Date(p._updatedAt || p.publishedAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(img ? { images: [img] } : {}),
    }
  })

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/services`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/services/brand-development`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services/still-motion`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services/communication`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/people`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/diary`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    // /careers is intentionally NOT listed: the public careers URL is
    // careers.boldcrest.com (a separate host), and boldcrest.com/careers
    // 308-redirects there — so the www sitemap shouldn't advertise it.
    { url: `${BASE_URL}/privacy-notice`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookie-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  return [...staticUrls, ...projectUrls, ...diaryUrls]
}
