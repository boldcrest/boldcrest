import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { allProjectsQuery, allDiaryPostsQuery } from '@/sanity/lib/queries'
import { imageUrlFrom } from '@/lib/seo'

const BASE_URL = 'https://www.boldcrest.com'

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
    client.fetch(allProjectsQuery) as Promise<ProjectRow[]>,
    client.fetch(allDiaryPostsQuery) as Promise<DiaryRow[]>,
  ])

  const projectUrls: MetadataRoute.Sitemap = (projects ?? []).map((p) => {
    const img = imageUrlFrom(p.thumbnail)
    return {
      url: `${BASE_URL}/work/${p.slug.current}`,
      lastModified: p._updatedAt ? new Date(p._updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      ...(img ? { images: [img] } : {}),
    }
  })

  const diaryUrls: MetadataRoute.Sitemap = (posts ?? []).map((p) => {
    const img = imageUrlFrom(p.coverImage)
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
    { url: `${BASE_URL}/careers`, changeFrequency: 'monthly', priority: 0.5 },
  ]

  return [...staticUrls, ...projectUrls, ...diaryUrls]
}
