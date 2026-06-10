import type { MetadataRoute } from 'next'

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boldcrest.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Internal / non-content routes that shouldn't be indexed.
        disallow: [
          '/studio',
          '/api/',
          '/coming-soon',
          '/button-preview',
          '/services-sample',
          '/start-a-new-project',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
