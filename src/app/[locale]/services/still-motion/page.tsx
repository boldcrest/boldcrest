import { setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { projectsByServicesQuery, serviceDetailPageQuery } from '@/sanity/lib/queries'
import StillMotionClient from './StillMotionClient'
import { BreadcrumbJsonLd, ServiceJsonLd, FAQJsonLd } from '@/components/services/JsonLd'

export const metadata: Metadata = {
  title: 'Photography, Video & Animation Production | Still & Motion | BoldCrest',
  description:
    'In-house photography, videography, animation, motion graphics, and post-production from Tirana. 22+ active brands, full in-house team. Production that matches your brand\'s ambition.',
  keywords: ['product photography Tirana', 'video production', 'TVC production', 'animation agency', 'motion graphics', 'content production'],
  openGraph: {
    title: 'Still & Motion Production | BoldCrest',
    description: 'In-house photography, videography, animation, motion graphics, and post-production. 22+ active brands.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  alternates: { canonical: '/services/still-motion' },
}

const FAQ_ITEMS = [
  { question: "What happens on a typical production day?", answer: "Our team (3-6 people depending on scope) arrives with a locked shot list, all equipment, and a creative director managing every frame. A half-day session delivers 10-15 retouched images; a full day delivers 20-30+ images plus potential reel footage." },
  { question: "Can I book just photography, or do I need a full retainer?", answer: "Photography is available as a one-time project or as a monthly add-on. You can also add regular photo shoots as an add-on to a social media retainer for consistent content flow." },
  { question: "What types of animation do you offer?", answer: "We offer everything from simple GIFs and animated posts through standard motion graphics and complex product showcases to full animation reels and project-level motion graphics. Pricing scales with complexity and length." },
  { question: "Do you handle TVC production?", answer: "Yes. We handle animated TVCs end-to-end: concept, storyboard, animation, sound design, and color. For live-action TVCs, we manage the full production: scripting, talent, shooting, editing, and post." },
  { question: "How fast can you deliver edited content?", answer: "Standard turnaround is within the monthly production cycle. Priority, Rush, and Emergency timelines available for accelerated delivery." },
]

export default async function StillMotionPage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const projects = await client.fetch(projectsByServicesQuery, {
    serviceNames: ['Photography', 'Videography'],
  })
  const content = await client.fetch(serviceDetailPageQuery, { pageKey: 'still-motion' })
  const faqItems = content?.faqs?.length ? content.faqs : FAQ_ITEMS

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: 'Home', url: '/' }, { name: 'Services', url: '/services' }, { name: 'Still & Motion', url: '/services/still-motion' }]} />
      <ServiceJsonLd name="Still & Motion Production" description="Photography, videography, animation, motion graphics, and post-production. Full in-house team." url="/services/still-motion" />
      <FAQJsonLd items={faqItems} />
      <StillMotionClient faqItems={faqItems} projects={projects ?? []} content={content ?? null} />
    </>
  )
}
