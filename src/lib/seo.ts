import { urlFor } from '@/sanity/lib/image'

/** Canonical production origin. Mirrors layout's metadataBase. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boldcrest.com'

export const DEFAULT_OG = `${SITE_URL}/og-image.png`

type SanityImage = { asset?: { _ref?: string } } | null | undefined

/** Build an absolute URL from a site-relative path. */
export function absUrl(path: string): string {
  if (!path) return SITE_URL
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`
}

/**
 * 1200×630 social-card URL from a Sanity image, falling back to the default
 * OG image when there's no usable asset (e.g. video-only projects).
 */
export function ogImageFrom(image?: SanityImage): string {
  if (image?.asset?._ref) {
    return urlFor(image).width(1200).height(630).fit('crop').auto('format').url()
  }
  return DEFAULT_OG
}

/** A larger source URL for image sitemaps / structured data. */
export function imageUrlFrom(image?: SanityImage, width = 1600): string | null {
  if (image?.asset?._ref) {
    return urlFor(image).width(width).auto('format').url()
  }
  return null
}

const ORG_REF = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'BoldCrest',
  url: SITE_URL,
} as const

const PUBLISHER = {
  '@type': 'Organization',
  name: 'BoldCrest',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/og-image.png`,
  },
} as const

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'BoldCrest',
    url: SITE_URL,
    publisher: ORG_REF,
    inLanguage: 'en',
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: absUrl(it.path),
    })),
  }
}

export function articleSchema(opts: {
  title: string
  description?: string
  path: string
  image?: string | null
  datePublished?: string
  dateModified?: string
  section?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: opts.title,
    description: opts.description,
    image: opts.image ? [opts.image] : [DEFAULT_OG],
    mainEntityOfPage: { '@type': 'WebPage', '@id': absUrl(opts.path) },
    url: absUrl(opts.path),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified || opts.datePublished,
    articleSection: opts.section,
    author: ORG_REF,
    publisher: PUBLISHER,
    inLanguage: 'en',
  }
}

export function creativeWorkSchema(opts: {
  name: string
  description?: string
  path: string
  image?: string | null
  keywords?: (string | undefined)[]
  about?: string
  datePublished?: string
}) {
  const keywords = (opts.keywords ?? []).filter(Boolean).join(', ')
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: opts.name,
    description: opts.description,
    url: absUrl(opts.path),
    image: opts.image ? [opts.image] : undefined,
    keywords: keywords || undefined,
    about: opts.about || undefined,
    datePublished: opts.datePublished || undefined,
    creator: ORG_REF,
    publisher: PUBLISHER,
    inLanguage: 'en',
  }
}
