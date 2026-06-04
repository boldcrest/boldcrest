'use client'

import ServiceHero from '@/components/services/ServiceHero'
import ProjectMarquee from '@/components/services/ProjectMarquee'
import OutcomesSection from '@/components/services/OutcomesSection'
import ServicesList from '@/components/services/ServicesList'
import ProcessTable from '@/components/services/ProcessTable'
import WhyUsSection from '@/components/services/WhyUsSection'
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
  { title: 'Instant Recognition', description: "A well-built identity makes your brand recognizable across every touchpoint, from a storefront sign to a 1-inch social avatar. We design systems that work at every scale." },
  { title: 'Trust Before the First Conversation', description: "Professional branding signals credibility. When your visual identity is cohesive and intentional, customers trust you before they've spoken to you." },
  { title: 'Competitive Separation', description: "In a growing market, everyone's fighting for attention. A distinctive brand gives you the edge, making competitors look like they're still figuring it out." },
]

const SERVICES = [
  { name: 'Visual Identity', href: '/work?service=Visual%20Identity', description: "The complete system that defines how the world sees your business. We build logo, color palette, typography hierarchy, graphic patterns, iconography, and photographic style direction into a cohesive language that works across every medium." },
  { name: 'Logo Design', href: '/work?service=Logo%20Design', description: "Your logo is the single most visible element of your brand. We develop 2-3 unique concepts grounded in strategic thinking, refined through collaborative rounds until every curve and letterform feels inevitable." },
  { name: 'Brand Guidelines', href: '/work?service=Brand%20Guidelines', description: "The rulebook that keeps your brand consistent when you're not in the room. Our brandbooks document every element with do's and don'ts and real application examples. From 30-page essentials to 80-page comprehensive manuals." },
  { name: 'Brand Strategy', href: '/work?service=Brand%20Strategy', description: "Before any visual work begins, we define who you are, who you're for, and where you stand in the market. Audience mapping, competitive analysis, positioning territory, and brand architecture." },
  { name: 'Packaging Design', href: '/work?service=Packaging%20Design', description: "The shelf is your stage. We design packaging that tells your story at the point of decision, from single products to full line systems with variant logic, 3D mockups, and print-ready dielines." },
  { name: 'Creative Advertising', href: '/work?service=Creative%20Advertising', description: "Key visuals, campaign concepts, and advertising creative that anchors your messaging across channels. From event materials to ATL campaign rollouts, print, digital, outdoor, and beyond." },
]

const PROCESS = [
  { number: '01', title: 'Discovery & Research', description: "A deep-dive workshop into your business goals, audience, competitive landscape, and brand aspirations. Not a questionnaire, a strategic conversation that shapes everything." },
  { number: '02', title: 'Moodboard & Direction', description: "We present curated visual territories exploring different directions for your brand's look and feel. You choose the territory, and we align before any design begins." },
  { number: '03', title: 'Concept Development', description: "2-3 distinct concepts, each grounded in strategy. We present with rationale, so you understand why each choice works, not just how it looks." },
  { number: '04', title: 'Refinement & Feedback', description: "Structured revision rounds refine the chosen direction until every detail is right. We welcome honest feedback and push back when we believe a different path serves you better." },
  { number: '05', title: 'Brand System Delivery', description: "Comprehensive brandbook, final files in all formats, and a brand toolkit ready for implementation. Logo, identity, packaging, guidelines. Everything documented and production-ready." },
  { number: '06', title: 'Implementation & Support', description: "We roll out the brand across your touchpoints: stationery, social templates, signage, packaging production files. And we stay available for ongoing brand evolution as you grow." },
]

const WHY_US = [
  { title: 'Strategy Before Style', description: "We never open Illustrator before the brief is locked. Every design decision is rooted in business reality, not trends that age in six months." },
  { title: 'Designed to Scale', description: "Whether you're a single-location cafe or a national FMCG brand, we build systems that work from business cards to billboards to packaging lines." },
  { title: 'Full Creative Team', description: "Senior designers, copywriters, and creative directors collaborate on every project. You're not getting one freelancer's perspective, you're getting a team." },
  { title: 'Proven Track Record', description: "300+ projects across 11 industries. Data-backed pricing, proven processes, and the depth of experience to navigate complex brand challenges." },
  { title: 'Packaging Expertise Built In', description: "Unlike agencies that outsource packaging, we have deep specialized packaging craft in-house. Identity and packaging designed by the same team means total coherence." },
  { title: 'Clear Revision Policy', description: "3 rounds included on brand development. If we made the error, the fix is free. If you change direction after sign-off, additional rounds at transparent rates." },
]

const OTHER_SERVICES = [
  { title: 'Still & Motion', href: '/services/still-motion', description: 'Frames and footage that hold attention.', color: '#f9b311' },
  { title: 'Communication', href: '/services/communication', description: 'Strategy and distribution that reach the right people.', color: '#004c95' },
]

export default function BrandDevelopmentClient({ faqItems, projects }: { faqItems: FAQItem[]; projects: Project[] }) {
  return (
    <main className="relative">
      <ServiceHero
        label="Brand Development"
        title="Brand Systems That Clarify Who You Are and Amplify How You're Seen"
        subtitle="Your brand is the promise you make before you say a word. We build identity systems, logos, visual languages, packaging, guidelines, and campaigns, that earn trust on sight and hold up everywhere your name appears."
        ctaLabel="Start Your Brand Project"
      />
      <ProjectMarquee projects={projects} accentColor="#DA291C" />
      <OutcomesSection heading="What Strong Brand Development Does for Your Business" outcomes={OUTCOMES} />
      <ServicesList heading="Our Brand Development Capabilities" services={SERVICES} ctaLabel="Get a Brand Proposal" />
      <ProcessTable heading="How We Build Brand Identity Systems" steps={PROCESS} />
      <WhyUsSection heading="What Sets Our Brand Development Apart" items={WHY_US} />
      <FAQSection heading="Brand Development Questions Answered" items={faqItems} ctaLabel="Book a Free Consultation" />
      <OtherServices services={OTHER_SERVICES} />
    </main>
  )
}
