import type { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { allProjectsQuery } from '@/sanity/lib/queries'

const BASE_URL = 'https://boldcrest.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await client.fetch(allProjectsQuery)

  const projectUrls: MetadataRoute.Sitemap = (projects ?? []).map(
    (p: { slug: { current: string } }) => ({
      url: `${BASE_URL}/work/${p.slug.current}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })
  )

  return [
    { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE_URL}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/services`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/services/brand-development`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services/still-motion`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/services/communication`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE_URL}/people`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE_URL}/diary`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/contact`, changeFrequency: 'yearly', priority: 0.6 },
    ...projectUrls,
  ]
}
