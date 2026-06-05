import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { allProjectsQuery } from '@/sanity/lib/queries'
import ServicesSampleClient from './ServicesSampleClient'

export const metadata: Metadata = {
  title: 'Services (Sample) — BoldCrest',
  description: 'Sample services layout.',
  robots: { index: false, follow: false },
}

const FAQ_ITEMS = [
  {
    question: 'What types of businesses do you work with?',
    answer:
      "We work with brands across food & beverage, fashion, hospitality, real estate, healthcare, finance, and tech. Our portfolio spans startups launching their first identity to national brands running multi-channel campaigns. If you're building something real, we're a fit.",
  },
  {
    question: 'Can I hire BoldCrest for just one thing, or do I need a full package?',
    answer:
      'Both. We do one-time projects, a logo, a photoshoot, a campaign kit, and ongoing retainers that bundle content planning, production, and management. Most clients start with a project and move to a retainer once they see the results.',
  },
  {
    question: 'What makes you different from other agencies?',
    answer:
      "Three things: we track everything (data-backed pricing built from real projects), we keep everything in-house (designers, photographers, videographers, animators, copywriters), and we don't separate strategy from execution. The people who think are the people who make.",
  },
  {
    question: 'Do you work with international brands?',
    answer:
      "Yes. Borghese Milano, Magniflex, Fentimans, and Red Bull are among the international brands we've collaborated with. Our process works seamlessly across borders with structured communication and milestone-based delivery.",
  },
  {
    question: 'How do I start a project?',
    answer:
      'Hit "Start a Project" and fill out the brief. Or email info@boldcrest.com. We\'ll schedule a discovery call, understand your needs, and come back with a tailored proposal within a week.',
  },
  {
    question: 'How do revisions and feedback work?',
    answer:
      'Every service includes defined revision rounds (typically 2-3). If we made the error, we fix it free, no questions. If you change direction after approval, additional rounds are available at transparent rates. Clear, fair, documented.',
  },
]

export default async function ServicesSamplePage() {
  const { data: projects } = await sanityFetch({ query: allProjectsQuery })

  return <ServicesSampleClient projects={projects ?? []} faqItems={FAQ_ITEMS} />
}
