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


/**
 * Every public URL exists in four languages. English is unprefixed
 * (`localePrefix: 'as-needed'`), the rest live under /sq, /fr, /it.
 *
 * Each entry also carries `alternates.languages` so Google sees the four as
 * translations of one page rather than four thin duplicates, and
 * `x-default` points at the unprefixed English URL.
 */
function localized(
  path: string,
  rest: Omit<MetadataRoute.Sitemap[number], 'url' | 'alternates'>,
): MetadataRoute.Sitemap {
  const href = (locale: string) =>
    locale === routing.defaultLocale
      ? `${BASE_URL}${path}`
      : `${BASE_URL}/${locale}${path}`

  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, href(locale)]),
  )

  return routing.locales.map((locale) => ({
    url: href(locale),
    ...rest,
    alternates: { languages: { ...languages, 'x-default': href(routing.defaultLocale) } },
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts] = await Promise.all([
    client.fetch(allProjectsQuery, { locale: routing.defaultLocale }) as Promise<ProjectRow[]>,
    client.fetch(allDiaryPostsQuery, { locale: routing.defaultLocale }) as Promise<DiaryRow[]>,
  ])

  const projectUrls: MetadataRoute.Sitemap = (projects ?? []).flatMap((p) => {
    const img = sitemapImageFrom(p.thumbnail)
    return localized(`/work/${p.slug.current}`, {
      lastModified: p._updatedAt ? new Date(p._updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
      ...(img ? { images: [img] } : {}),
    })
  })

  const diaryUrls: MetadataRoute.Sitemap = (posts ?? []).flatMap((p) => {
    const img = sitemapImageFrom(p.coverImage)
    return localized(`/diary/${p.slug.current}`, {
      lastModified: new Date(p._updatedAt || p.publishedAt || Date.now()),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      ...(img ? { images: [img] } : {}),
    })
  })

  const staticUrls: MetadataRoute.Sitemap = [
    ...localized('', { changeFrequency: 'weekly', priority: 1 }),
    ...localized('/work', { changeFrequency: 'weekly', priority: 0.9 }),
    ...localized('/services', { changeFrequency: 'monthly', priority: 0.9 }),
    ...localized('/services/brand-development', { changeFrequency: 'monthly', priority: 0.8 }),
    ...localized('/services/still-motion', { changeFrequency: 'monthly', priority: 0.8 }),
    ...localized('/services/communication', { changeFrequency: 'monthly', priority: 0.8 }),
    ...localized('/people', { changeFrequency: 'monthly', priority: 0.7 }),
    ...localized('/diary', { changeFrequency: 'weekly', priority: 0.7 }),
    ...localized('/contact', { changeFrequency: 'yearly', priority: 0.6 }),
    // /careers is intentionally NOT listed: the public careers URL is
    // careers.boldcrest.com (a separate host), and boldcrest.com/careers
    // 308-redirects there — so the www sitemap shouldn't advertise it.
    // The two legal pages stay English-only (untranslated by design).
    { url: `${BASE_URL}/privacy-notice`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/cookie-policy`, changeFrequency: 'yearly', priority: 0.3 },
  ]

  return [...staticUrls, ...projectUrls, ...diaryUrls]
}
