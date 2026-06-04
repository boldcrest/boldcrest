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
  { title: "Content That Matches Your Brand's Ambition", description: "Your audience judges quality in the first second. Professionally shot, edited, and graded content instantly signals that your brand is serious, polished, and worth paying attention to." },
  { title: 'A Full Visual Library', description: "One production day with our team generates months of content: feed photos, reels, product shots, stories, and animation assets, all from a single coordinated session." },
  { title: 'Consistent Quality at Scale', description: "Whether it's your 3rd shoot or your 30th, the same creative directors, photographers, and editors maintain your brand's visual standard across every frame." },
]

const SERVICES = [
  { name: 'Photography', href: '/work?service=Photography', description: "Content shoots, editorial sessions, product photography, food styling, event coverage, and lifestyle campaigns. Our in-house team delivers 10-40 retouched images per session." },
  { name: 'Videography', href: '/work?service=Videography', description: "From scripted TVC spots to raw behind-the-scenes content, we handle pre-production, on-set direction, and multi-camera capture. Reels priced by complexity and delivery method." },
  { name: 'Animation', href: '/work?service=Animation', description: "GIFs, animated social posts, motion graphics, and full animation reels. From simple text reveals to complex product showcases to animated TVCs. Experience across 31 clients." },
  { name: 'Motion Graphics', href: '/work?service=Motion%20Graphics', description: "Campaign teasers, branded intro sequences, data visualizations, and animated explainers. 2D and 2.5D motion work for social, digital screens, events, and broadcast." },
  { name: 'Post-Production', href: '/work?service=Post-Production', description: "Editing, assembly, transitions, audio sync, sound design, and final mastering. We turn raw material into polished, platform-ready content." },
  { name: 'Color Grading', href: '/work?service=Color%20Grading', description: "Professional color correction and grading that gives your footage a distinctive, consistent visual signature. From simple correction to cinematic-grade looks." },
]

const PROCESS = [
  { number: '01', title: 'Pre-Production & Planning', description: "We define the shot list, scout locations, plan logistics, and assemble the right team. Every production day is meticulously planned for maximum output." },
  { number: '02', title: 'Creative Direction', description: "Our creative directors are on-set, guiding every frame. Composition, lighting, talent direction, and brand alignment are managed in real-time, not fixed in post." },
  { number: '03', title: 'Capture', description: "Photography and video captured by our in-house team: 2-6 people per shoot depending on scope. Photographers, videographers, coordinators, and account managers." },
  { number: '04', title: 'Editing & Post-Production', description: "Raw footage becomes polished content: cutting, transitions, audio, color grading, and platform formatting. Animation and motion graphics crafted frame by frame." },
  { number: '05', title: 'Retouching & Finishing', description: "Images retouched by our specialist retouchers. Basic retouching for content shoots, advanced retouching for editorial and beauty work, and product cutouts for e-commerce." },
  { number: '06', title: 'Delivery & Asset Management', description: "Final files delivered in all required formats and resolutions. Platform-specific exports for social, web, and print. Organized asset library so nothing gets lost." },
]

const WHY_US = [
  { title: 'Full In-House Team', description: "Key photographers, dedicated retouchers, video editors, and animators. No outsourcing roulette. The same people who know your brand shoot and edit your content." },
  { title: 'Extensive Photoshoot Experience', description: "Across 15 clients. From half-day content sessions to multi-day editorial campaigns, we've handled productions of every scale." },
  { title: 'Batch Efficiency', description: "A Batch Shoot (4+ reels) costs 30-40% less per reel than solo sessions. We plan for maximum output per production day." },
  { title: "Animation Depth Others Can't Match", description: "31 clients served. Style consistency across your entire content ecosystem." },
  { title: 'Transparent, Data-Backed Pricing', description: "Every price in our catalog is built from real project data, not industry benchmarks. You know exactly what you're paying for." },
  { title: 'Editorial-Grade When You Need It', description: "Fashion-grade, campaign-quality imagery when the brief demands the highest tier of production." },
]

const OTHER_SERVICES = [
  { title: 'Brand Development', href: '/services/brand-development', description: 'Identity systems that clarify who you are.', color: '#DA291C' },
  { title: 'Communication', href: '/services/communication', description: 'Strategy and distribution that reach the right people.', color: '#004c95' },
]

export default function StillMotionClient({ faqItems, projects }: { faqItems: FAQItem[]; projects: Project[] }) {
  return (
    <main className="relative">
      <ServiceHero
        label="Still & Motion"
        title="Still Frames That Hold Attention. Moving Images That Move People."
        subtitle="Photography, videography, animation, and post-production, handled by a full in-house team that plans, shoots, edits, and delivers production-ready content. Every frame intentional. Every second earned."
        ctaLabel="Start a Production Project"
      />
      <ProjectMarquee projects={projects} accentColor="#f9b311" />
      <OutcomesServices
        outcomesHeading="What Professional Production Delivers?"
        outcomes={OUTCOMES}
        servicesHeading="Our Still & Motion Capabilities"
        services={SERVICES}
        accentColor="#f9b311"
      />
      <ProcessTable heading="How We Run Production" steps={PROCESS} accentColor="#f9b311" />
      <WhyUsSection heading="Why Brands Choose BoldCrest for Production" items={WHY_US} />
      <FAQSection heading="Production Questions Answered" items={faqItems} noTopBorder grayBg />
      <OtherServices services={OTHER_SERVICES} />
    </main>
  )
}
