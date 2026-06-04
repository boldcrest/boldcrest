'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
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

const TIERS = [
  { name: 'Scout', posts: '9 posts/month', description: 'Content calendar, copywriting, scheduling, monthly report. Perfect for brands just starting their social presence.' },
  { name: 'Hiker', posts: '12 posts/month', description: 'Everything in Scout plus 1 strategy session. For brands building consistent momentum.' },
  { name: 'Climber', posts: '16 posts/month', description: 'For brands with active audiences that demand more frequent, varied content.' },
  { name: 'Alpinist', posts: '20 posts/month', description: 'Full-volume management with 2 strategy sessions and priority support. For national brands and high-output accounts.' },
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

function RetainerTiers() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="px-[var(--gutter)] py-[var(--space-3xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          How It&apos;s Structured
        </motion.p>
        <motion.h2
          className="mb-4 max-w-[600px] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Monthly Retainer Tiers
        </motion.h2>
        <motion.p
          className="mb-[var(--space-xl)] max-w-[600px] text-[0.95rem] leading-[1.7] text-text-secondary"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          We build custom content bundles per client. The tier is a content
          planning baseline, not a service level. Every client gets the same
          quality.
        </motion.p>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.name}
              className="rounded-2xl border border-border/40 p-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.2 + i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <h3 className="mb-1 font-display text-[1.2rem] font-bold text-text-primary">
                {tier.name}
              </h3>
              <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                {tier.posts}
              </p>
              <p className="text-[0.8rem] leading-[1.6] text-text-secondary">
                {tier.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

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
      <OutcomesSection heading="What Strategic Communication Delivers" outcomes={OUTCOMES} />
      <ServicesList heading="Our Communication Capabilities" services={SERVICES} ctaLabel="Build Your Communication Plan" />
      <ProcessTable heading="How We Run Communication" steps={PROCESS} />
      <RetainerTiers />
      <WhyUsSection heading="Why Brands Choose BoldCrest for Communication" items={WHY_US} />
      <FAQSection heading="Communication Questions Answered" items={faqItems} ctaLabel="Get Your Strategy Started" />
      <OtherServices services={OTHER_SERVICES} />
    </main>
  )
}
