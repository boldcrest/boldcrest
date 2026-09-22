import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { client, CMS_REVALIDATE } from '@/sanity/lib/client'
import { projectsByServicesQuery, serviceDetailPageQuery } from '@/sanity/lib/queries'
import CommunicationClient from './CommunicationClient'
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd } from '@/components/services/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  // The canonical must carry the locale prefix. A static '/services/communication' told Google
  // every localised service page was a duplicate of the English one.
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: { absolute: t('commsTitle') },
    description: t('commsDescription'),
    keywords: t.raw('commsKeywords') as string[],
    openGraph: {
      title: t('commsOgTitle'),
      description: t('commsOgDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    alternates: { canonical: `${prefix}/services/communication` },
  }
}

const FAQ_ITEMS = [
  { question: "How many posts do I get per month?", answer: "Base packages range from 9 (Scout) to 20 (Alpinist). On top, you add graphic posts, reels, animations, and stories as individual units. We build a custom bundle based on your actual goals." },
  { question: "Do I need to provide my own content?", answer: "No. We handle everything from strategy to shoot to scheduling. If you have existing assets, great, we'll integrate them. If not, our Still & Motion team produces all the content you need." },
  { question: "Can you manage my paid ads as well?", answer: "Yes. We handle campaign setup and ongoing management including strategy, creative, optimization, and monthly reporting. Up to 3 ad variants with A/B testing." },
  { question: "What platforms do you manage?", answer: "Instagram, Facebook, LinkedIn, and TikTok. Content is formatted per platform: stories, reels, feed posts, carousels, and articles, each sized and optimized for where your audience lives." },
  { question: "How fast can you turn around content?", answer: "Standard turnaround is within the monthly production cycle. Priority, Rush, and Emergency timelines available for accelerated delivery." },
  { question: "What does the monthly report include?", answer: "KPIs, engagement rates, follower growth, top-performing posts, competitor benchmark, audience demographics, and strategic recommendations for the next month." },
]

export default async function CommunicationPage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const projects = await client.fetch(projectsByServicesQuery, {
    locale,
    serviceNames: ['Social Media Management', 'Ads Management'],
  }, { next: { revalidate: CMS_REVALIDATE } })
  const content = await client.fetch(serviceDetailPageQuery, { pageKey: 'communication', locale }, { next: { revalidate: CMS_REVALIDATE } })
  const faqItems = content?.faqs?.length ? content.faqs : FAQ_ITEMS

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: 'Communication', url: '/services/communication' }]} />
      <ServiceJsonLd name="Communication Services" description="Social media management, digital marketing, PR, content strategy, and campaign management." url="/services/communication" />
      <FAQJsonLd items={faqItems} />
      <CommunicationClient faqItems={faqItems} projects={projects ?? []} content={content ?? null} />
    </>
  )
}
