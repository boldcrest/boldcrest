'use client'

import { useTranslations } from 'next-intl'

import ServiceHero from '@/components/services/ServiceHero'
import ProjectMarquee from '@/components/services/ProjectMarquee'
import OutcomesServices from '@/components/services/OutcomesServices'
import ProcessTable from '@/components/services/ProcessTable'
import WhyUsSection from '@/components/services/WhyUsSection'
import ServiceCTA from '@/components/services/ServiceCTA'
import FAQSection from '@/components/services/FAQSection'
import OtherServices from '@/components/services/OtherServices'

interface FAQItem { question: string; answer: string }

interface Project {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  client?: string
  industry?: string
  services?: string[]
  thumbnail?: { asset: { _ref: string } }
  thumbnailType?: string
  thumbnailVideo?: string
}

const OUTCOMES = [
  { title: 'Instant Recognition', description: "A well built identity makes your brand recognizable across every touchpoint, from a storefront sign to a 1 inch social avatar. We design identity frameworks that work at every scale, keeping your brand consistent, distinctive, and easy to recognize wherever it appears." },
  { title: 'Trust Before the First Conversation', description: "Professional branding signals credibility. When your visual identity is cohesive and intentional, customers trust you before they've spoken to you." },
  { title: 'Competitive Separation', description: "In a crowded market, attention goes to the brands that know exactly who they are. A distinctive identity gives you the edge, helping your brand become easier to recognize, harder to replace, and impossible to mistake for the next name in line." },
]

const SERVICES = [
  { name: 'Visual Identity', href: '/work?service=Visual%20Identity', description: "We build your full visual identity to give your brand a presence people notice now and remember long after. From logo, color palette, typography hierarchy, graphic patterns, iconography, and photographic style direction, we explore every detail to define the right visual language for your brand. Every element is created to feel cohesive, distinctive, and ready to work across every medium." },
  { name: 'Logo Design', href: '/work?service=Logo%20Design', description: "Your logo is the single most visible element of your brand. We develop a strategically grounded concept that feels distinctive, balanced, and built to stand the test of time. Through collaborative refinement, every curve, letterform, and detail is shaped until the logo feels not just designed, but meant to exist." },
  { name: 'Brand Guidelines', href: '/work?service=Brand%20Guidelines', description: "The rulebook that keeps your brand consistent when you're not in the room. Our brand books document every element with do's and don'ts and real application examples. From 30-page essentials to 80-page comprehensive manuals." },
  { name: 'Brand Strategy', href: '/work?service=Brand%20Strategy', description: "Before any visual work begins, we define who you are, who you're for, and where you stand in the market. Audience mapping, competitive analysis, positioning territory, and brand architecture." },
  { name: 'Packaging Design', href: '/work?service=Packaging%20Design', description: "The shelf is your stage. We design packaging that tells your story at the point of decision, from single products to full line systems with variant logic, 3D mockups, and print-ready die lines." },
  { name: 'Creative Advertising', href: '/work?service=Creative%20Advertising', description: "From key visuals and campaign concepts to event materials, ATL rollouts, print, digital, outdoor, and beyond, we create advertising systems built to travel across channels. Our work is shaped to be visually distinctive and strategically written, so every campaign has both the look to capture attention and the message to stay with people." },
]

const PROCESS = [
  { number: '01', title: 'Discovery & Research', description: "A deep-dive workshop into your business goals, audience, competitive landscape, and brand aspirations. Not a questionnaire, a strategic conversation that shapes everything." },
  { number: '02', title: 'Moodboard & Direction', description: "We present curated visual territories exploring different directions for your brand's look and feel. You choose the territory, and we align before any design begins." },
  { number: '03', title: 'Concept Development', description: "One concept, fully resolved. We don't hedge with variations, we commit to a single direction grounded in strategy and present it with the rationale behind every choice, so you understand why it works, not just how it looks." },
  { number: '04', title: 'Refinement & Feedback', description: "Structured revision rounds refine the chosen direction until every detail is right. We welcome honest feedback and push back when we believe a different path serves you better." },
  { number: '05', title: 'Brand System Delivery', description: "Comprehensive brandbook, final files in all formats, and a brand toolkit ready for implementation. Logo, identity, packaging, guidelines. Everything documented and production-ready." },
  { number: '06', title: 'Implementation & Support', description: "We roll out the brand across your touchpoints: stationery, social templates, signage, packaging production files. And we stay available for ongoing brand evolution as you grow." },
]

const WHY_US = [
  { title: 'Strategy Before Style', description: "We never open Illustrator before the brief is locked. Every design choice has to answer to the brand, the market, and the brief, not to whatever is trending this quarter." },
  { title: 'Designed to Scale', description: "Whether you are a neighborhood cafe or a national FMCG brand, your identity needs to look just as strong on a coffee cup as it does across a full packaging line, campaign rollout, or city billboard." },
  { title: 'Full Creative Team', description: "Senior designers, copywriters, and creative directors collaborate on every project. You are not getting one person's point of view. You are getting a room full of people who know how to make brands look sharper, sound clearer, and land exactly where they should." },
  { title: 'Proven Track Record', description: "300+ projects across 11 industries means we do not walk into brand challenges guessing. We bring tested processes, project data, and the kind of experience that helps brands move from creative ideas to creative decisions that actually hold up." },
  { title: 'Packaging Expertise Built In', description: "Unlike agencies that outsource packaging, we have specialized packaging craft in house. Identity and packaging are shaped by the same team, so the brand feels consistent from the first logo application to the final shelf presence." },
  { title: 'Clear Revision Policy', description: "2 rounds included on brand development. If the error is on our side, we correct it at no additional cost. If the direction changes after sign off, additional rounds are available at transparent rates." },
]

const OTHER_SERVICES = [
  { title: 'Still & Motion', href: '/services/still-motion', description: 'Frames and footage that hold attention.', color: '#f9b311' },
  { title: 'Communication', href: '/services/communication', description: 'Strategy and distribution that reach the right people.', color: '#004c95' },
]

// Editable copy from Sanity (serviceDetailPage). All optional — falls back to
// the constants above so the page never breaks.
export interface ServicePageContent {
  hero?: { label?: string; title?: string; subtitle?: string; ctaLabel?: string }
  outcomesHeading?: string
  outcomes?: { title: string; description: string }[]
  capabilitiesHeading?: string
  capabilities?: { name: string; link: string; description: string }[]
  processHeading?: string
  processSteps?: { number: string; title: string; description: string }[]
  whyUsHeading?: string
  whyUsItems?: { title: string; description: string }[]
  otherServices?: { title: string; description: string }[]
  ctaSection?: {
    label?: string
    heading?: string
    description?: string
    buttonLabel?: string
  }
  faqs?: FAQItem[]
}

export default function BrandDevelopmentClient({
  faqItems,
  projects,
  content,
}: {
  faqItems: FAQItem[]
  projects: Project[]
  content?: ServicePageContent | null
}) {
  const tCta = useTranslations('Cta')
  const tServices = useTranslations('Services')
  const hero = content?.hero
  const outcomes = content?.outcomes?.length ? content.outcomes : OUTCOMES
  const services = content?.capabilities?.length
    ? content.capabilities.map((c) => ({ name: c.name, href: c.link, description: c.description }))
    : SERVICES
  const process = content?.processSteps?.length ? content.processSteps : PROCESS
  const whyUs = content?.whyUsItems?.length ? content.whyUsItems : WHY_US
  const otherServices = OTHER_SERVICES.map((s, i) => ({
    ...s,
    title: content?.otherServices?.[i]?.title ?? s.title,
    description: content?.otherServices?.[i]?.description ?? s.description,
  }))

  return (
    <main className="relative">
      <ServiceHero
        label={hero?.label ?? 'Brand Development'}
        title={hero?.title ?? "Brand Systems That Clarify Who You Are and Amplify How You're Seen"}
        subtitle={
          hero?.subtitle ??
          'Your brand is the promise you make before you say a word. We build identity systems, logos, visual languages, packaging, guidelines, and campaigns, that earn trust on sight and hold up everywhere your name appears.'
        }
        ctaLabel={hero?.ctaLabel ?? 'Start Your Brand Project'}
      />
      <ProjectMarquee projects={projects} accentColor="#DA291C" />
      <OutcomesServices
        outcomesHeading={content?.outcomesHeading ?? 'What Strong Brand Development Does for Your Business?'}
        outcomes={outcomes}
        servicesHeading={content?.capabilitiesHeading ?? 'Our Brand Development Capabilities'}
        services={services}
        accentColor="#DA291C"
      />
      <ProcessTable
        heading={content?.processHeading ?? 'How We Build Brand Identity Systems'}
        steps={process}
        accentColor="#DA291C"
      />
      <WhyUsSection
        heading={content?.whyUsHeading ?? 'What Sets Our Brand Development Apart'}
        items={whyUs}
        accentColor="#DA291C"
      />
      {/* Conversion block between the argument (Why Us) and the objection
          handling (FAQ). CMS-editable like the rest of the page, with the
          copy below as the fallback. */}
      <ServiceCTA
        label={content?.ctaSection?.label ?? undefined}
        heading={content?.ctaSection?.heading ?? tCta('brandHeading')}
        description={content?.ctaSection?.description ?? tCta('brandBody')}
        buttonLabel={content?.ctaSection?.buttonLabel ?? undefined}
      />
      <FAQSection heading={tServices('faqBrand')} items={faqItems} noTopBorder grayBg />
      <OtherServices services={otherServices} />
    </main>
  )
}
