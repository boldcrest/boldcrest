import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { client, CMS_REVALIDATE } from '@/sanity/lib/client'
import { projectsByServicesQuery, serviceDetailPageQuery } from '@/sanity/lib/queries'
import BrandDevelopmentClient from './BrandDevelopmentClient'
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd } from '@/components/services/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  // The canonical must carry the locale prefix. A static '/services/brand-development' told Google
  // every localised service page was a duplicate of the English one.
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: { absolute: t('brandTitle') },
    description: t('brandDescription'),
    keywords: t.raw('brandKeywords') as string[],
    openGraph: {
      title: t('brandOgTitle'),
      description: t('brandOgDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    alternates: { canonical: `${prefix}/services/brand-development` },
  }
}

const FAQ_ITEMS = [
  { question: "What's the difference between a logo and a visual identity?", answer: "A logo is one element, your mark. A visual identity is the complete system: logo, colors, typography, patterns, imagery style, and the rules governing how they work together. Think of the logo as your face and the identity as your entire wardrobe, posture, and voice." },
  { question: "How many logo concepts will I see?", answer: "One. Not because we limit the process, but because we believe the strongest direction should not arrive as a guessing game. Before we present, we explore, compare, and refine internally until the concept answers the brief, reflects the brand vision, and has a clear reason to exist. From there, we develop the chosen direction through 2 to 3 collaborative revision rounds." },
  { question: "Can you rebrand an existing business?", answer: "Absolutely. We have handled rebrands for Tepelene, Infratech, Hako, Tierr, Baboon, Albita, and other established brands. Our process starts with a clear brand audit, then moves into logo refinement, updated visual assets, brand templates, and a complete guide that helps the new identity work consistently across every touchpoint." },
  { question: "Do I own the final brand files?", answer: "Yes. Full ownership transfers on final payment. All source files (AI, SVG, PNG, PDF) plus the brand book. We retain portfolio rights unless otherwise agreed." },
  { question: "Can you design packaging as part of a branding project?", answer: "Yes, and it often makes the brand stronger. Packaging is where identity becomes something people can hold, notice, and choose. We design everything from single product packs to full product lines, making sure the brand looks clear, consistent, and shelf ready from the first SKU to the last." },
  { question: "How long does a branding project take?", answer: "Logo: 2-3 weeks. Full visual identity with brandbook: 4-8 weeks. Packaging: 2-4 weeks per product. We'll lock a timeline in our first meeting." },
]

export default async function BrandDevelopmentPage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const projects = await client.fetch(projectsByServicesQuery, {
    locale,
    serviceNames: ['Branding', 'Creative Advertising', 'Packaging'],
  }, { next: { revalidate: CMS_REVALIDATE } })
  const content = await client.fetch(serviceDetailPageQuery, { pageKey: 'brand-development', locale }, { next: { revalidate: CMS_REVALIDATE } })
  const faqItems = content?.faqs?.length ? content.faqs : FAQ_ITEMS

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: 'Brand Development', url: '/services/brand-development' }]} />
      <ServiceJsonLd name="Brand Development" description="Strategic brand development: logo design, visual identity systems, brand guidelines, packaging design, and creative advertising." url="/services/brand-development" />
      <FAQJsonLd items={faqItems} />
      <BrandDevelopmentClient faqItems={faqItems} projects={projects ?? []} content={content ?? null} />
    </>
  )
}
