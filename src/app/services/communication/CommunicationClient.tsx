'use client'

import ServiceHero from '@/components/services/ServiceHero'
import ProjectMarquee from '@/components/services/ProjectMarquee'
import OutcomesServices from '@/components/services/OutcomesServices'
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
  { title: 'Consistent Visibility', description: "Your audience scrolls every day. A structured content system keeps your brand visible, relevant, and top-of-mind, without you writing captions at midnight." },
  { title: 'Strategic Reach, Not Random Noise', description: "Every post, campaign, and media placement connects to a plan. We build calendars tied to business goals, seasonal opportunities, and audience behavior." },
  { title: 'Measurable Growth', description: "Monthly reporting with KPIs, engagement metrics, audience growth, and competitor benchmarking. You'll know exactly what's working and what to adjust." },
]

const SERVICES = [
  { name: 'Social Media Management', href: '/work?service=Social%20Media', description: "End-to-end social media: content planning, calendar creation, copywriting, design coordination, scheduling, and performance reporting. Four tiers from 9 to 20 posts/month." },
  { name: 'Digital Marketing', href: '/work?service=Digital%20Marketing', description: "Paid campaigns across Meta, Google, and other platforms. Strategy, audience targeting, creative development, pixel setup, A/B testing, and ongoing optimization." },
  { name: 'Content Strategy', href: '/work?service=Content%20Strategy', description: "We define content pillars, audience segments, posting cadence, platform strategy, and seasonal calendars. A living system we operate month after month." },
  { name: 'Campaign Management', href: '/work?service=Campaign%20Management', description: "Full campaign orchestration from concept to execution: brief development, creative production, media planning, channel coordination, and performance tracking." },
  { name: 'Public Relations', href: '/work?service=Public%20Relations', description: "Press outreach, influencer coordination, event PR, and brand reputation management. Amplify your message beyond owned channels." },
  { name: 'Media Planning', href: '/work?service=Media%20Planning', description: "Channel selection, budget allocation, and timing optimization across paid, owned, and earned media. Maximizing reach while respecting your budget." },
]

const PROCESS = [
  { number: '01', title: 'Audit & Onboarding', description: "We review your current presence, audit existing content, analyze competitors, and identify gaps. A clear picture of where you stand before we touch a single channel." },
  { number: '02', title: 'Strategy & Calendar', description: "Monthly content calendars tied to business goals, seasonal moments, and audience behavior. Every post has a purpose: awareness, engagement, conversion, or community." },
  { number: '03', title: 'Content Production', description: "Posts are designed, reels edited, animations crafted, and copy written. Everything runs through internal review. Coordinated with our Still & Motion team." },
  { number: '04', title: 'Approval & Scheduling', description: "You review, provide consolidated feedback (one contact person, 48-hour window), and we schedule everything. Your feed runs on autopilot." },
  { number: '05', title: 'Campaign Execution', description: "Paid campaigns launched, monitored, and optimized in real time. A/B testing, audience refinement, and creative rotation to maximize performance." },
  { number: '06', title: 'Reporting & Optimization', description: "Monthly performance reports: what worked, what to improve, what to try next. Strategy adjusts based on real data, not gut feeling." },
]

const WHY_US = [
  { title: 'Production + Distribution Under One Roof', description: "Most agencies either create content or manage channels. We do both. The people planning your calendar are the same people shooting your content." },
  { title: '22+ Brands in Active Management', description: "Not a side service, our most active discipline. From boutique fashion accounts to national FMCG campaigns." },
  { title: 'Data-Backed Pricing', description: "Every price is built from real project data, not industry guesswork. You know exactly what you're paying for." },
  { title: 'Dedicated Account Manager', description: "Every client gets a named contact who knows your brand, schedule, and preferences. No revolving door." },
  { title: 'Scalable from Starter to Full-Service', description: "Start with 9 posts/month and scale to 20+ with photography, video, animation, and ads layered on." },
  { title: 'Transparent Revision Policy', description: "1 revision per post, 48-hour window. Monthly plans get 2 rounds. If we made the mistake, the fix is free." },
]

const OTHER_SERVICES = [
  { title: 'Brand Development', href: '/services/brand-development', description: 'Identity systems that clarify who you are.', color: '#DA291C' },
  { title: 'Still & Motion', href: '/services/still-motion', description: 'Frames and footage that hold attention.', color: '#f9b311' },
]

export default function CommunicationClient({ faqItems, projects }: { faqItems: FAQItem[]; projects: Project[] }) {
  return (
    <main className="relative">
      <ServiceHero
        label="Communication"
        title="Strategy, Content, and Distribution. Orchestrated to Reach the Right People."
        subtitle="A great brand in silence is a waste. We put yours where it belongs, in front of the right audience, saying the right thing, at the right moment. From monthly social management to full-scale campaign orchestration."
        ctaLabel="Start a Communication Project"
      />
      <ProjectMarquee projects={projects} accentColor="#004c95" />
      <OutcomesServices
        outcomesHeading="What Strategic Communication Delivers?"
        outcomes={OUTCOMES}
        servicesHeading="Our Communication Capabilities"
        services={SERVICES}
        accentColor="#004c95"
      />
      <ProcessTable heading="How We Run Communication" steps={PROCESS} accentColor="#004c95" />
      <WhyUsSection heading="Why Brands Choose BoldCrest for Communication" items={WHY_US} />
      <FAQSection heading="Communication Questions Answered" items={faqItems} noTopBorder grayBg />
      <OtherServices services={OTHER_SERVICES} />
    </main>
  )
}
