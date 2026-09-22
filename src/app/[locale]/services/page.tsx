import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { allServicesByCategoryQuery, servicesPartnersQuery, servicesPageQuery } from '@/sanity/lib/queries'
import ServicesPageClient from './ServicesPageClient'
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd } from '@/components/services/JsonLd'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  // The canonical must carry the locale prefix. A static '/services' told Google
  // every localised service page was a duplicate of the English one.
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: t('servicesTitle'),
    description: t('servicesDescription'),
    keywords: t.raw('servicesKeywords') as string[],
    openGraph: {
      title: t('servicesOgTitle'),
      description: t('servicesOgDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    alternates: { canonical: `${prefix}/services` },
  }
}

const FAQ_ITEMS = [
  {
    question: 'What types of businesses do you work with?',
    answer:
      'If it can be launched, booked, tasted, worn, visited, financed, or experienced, we can help people understand it, want it, and choose it. We work with brands across food & beverage, fashion, hospitality, real estate, healthcare, finance, and tech. From startups building their first identity to established brands growing through multi-channel campaigns.',
  },
  {
    question: 'Can I hire BoldCrest for just one thing, or do I need a full package?',
    answer:
      'You can start with one thing. We just can\'t promise you\'ll want to stop there. We do one time projects like a brand identity, a photoshoot, or a campaign kit, as well as ongoing retainers that cover content planning, production, and management. The setup depends on what your brand needs now and how far you want to take it next.',
  },
  {
    question: 'What makes you different from other agencies?',
    answer:
      'We connect the dots others usually separate. Our decisions are shaped by real project data, not guesswork. Our team works fully in house, from design and copy to photography, video, and animation. Strategy and execution move together from the very first step. The people who think are the people who make.',
  },
  {
    question: 'Do you work with international brands?',
    answer:
      'Yes. We work with brands across different markets through clear communication, structured timelines, and a process built to keep every project aligned from start to finish. Some of our collaborations include Magniflex, Fentimans, Red Bull, Coca Cola, Fanta, Tomarchio, Piaggio Group, Wolt, and Cipriani.',
  },
  {
    question: 'How do I start a project?',
    answer:
      'Hit "Start a Project" and fill out the brief. Or email info@boldcrest.com. We\'ll schedule a discovery call, understand your needs, and come back with a tailored proposal.',
  },
  {
    question: 'How do revisions and feedback work?',
    answer:
      'Every service includes defined revision rounds (typically 2). If we made the error, we fix it free, no questions. If you change direction after approval, additional rounds are available at transparent rates. Clear, fair, documented.',
  },
]

interface Service {
  _id: string
  name: string
  slug: { current: string }
  category: string
  order: number
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const [{ data: services }, { data: partners }, { data: content }] = await Promise.all([
    sanityFetch({ query: allServicesByCategoryQuery }),
    sanityFetch({ query: servicesPartnersQuery }),
    sanityFetch({ query: servicesPageQuery, params: { locale } }),
  ])

  const categories = ['Brand Dev', 'Still & Motion', 'Communications']
  const grouped = categories.map((cat) => ({
    category: cat,
    services: ((services as Service[]) ?? []).filter(
      (s) => s.category === cat
    ),
  }))
  const faqItems = content?.faqs?.length ? content.faqs : FAQ_ITEMS

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Services', url: '/services' },
        ]}
      />
      <ServiceJsonLd
        name="BoldCrest Creative Services"
        description="Brand development, still & motion production, and communication services. 300+ projects across 11 industries."
        url="/services"
      />
      <FAQJsonLd items={faqItems} />
      <ServicesPageClient
        categories={grouped}
        faqItems={faqItems}
        partners={partners ?? []}
        content={content ?? null}
      />
    </>
  )
}
