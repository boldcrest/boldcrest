import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allServicesByCategoryQuery, servicesPartnersQuery, servicesPageQuery } from '@/sanity/lib/queries'
import ServicesPageClient from './ServicesPageClient'
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd } from '@/components/services/JsonLd'

export const metadata: Metadata = {
  // Short, keyword-rich title; the root layout template appends "— BoldCrest"
  // once (every other page follows this pattern). Don't include the brand here
  // or it doubles. The full keyword detail lives in the description below.
  title: 'Creative Agency Services',
  description:
    'BoldCrest is a Tirana-based creative agency offering brand development, photography, video, animation, and communication. 300+ projects, 30+ brands, 7+ years of creative excellence.',
  keywords: ['creative agency Tirana', 'branding agency', 'creative services', 'best branding agencies Tirana'],
  openGraph: {
    title: 'Creative Agency Services | BoldCrest',
    description:
      'BoldCrest is a Tirana-based creative agency offering brand development, photography, video, animation, and communication. 300+ projects, 30+ brands, 7+ years.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  alternates: {
    canonical: '/services',
  },
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
