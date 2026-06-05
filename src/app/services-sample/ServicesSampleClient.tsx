'use client'

import { useRef, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import FAQSection from '@/components/services/FAQSection'

interface FAQItem {
  question: string
  answer: string
}

interface Project {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  client?: string
  industry?: string
  services?: string[]
  thumbnailType?: string
  thumbnail?: { asset?: { _ref: string } }
  thumbnailVideo?: string
}

interface Section {
  num: string
  title: string
  href: string
  accent: string
  description: string
  tags: string[]
  serviceNames: string[]
  cardCount: number
}

const SECTIONS: Section[] = [
  {
    num: '01',
    title: 'Brand Development',
    href: '/services/brand-development',
    accent: '#DA291C',
    description:
      "Identity systems that clarify who you are and amplify how you're seen. Logos, visual languages, packaging, and guidelines that earn trust on sight and hold up everywhere your name appears.",
    tags: ['Visual Identity', 'Logo Design', 'Brand Guidelines', 'Brand Strategy', 'Packaging'],
    serviceNames: ['Branding', 'Packaging', 'Creative Advertising'],
    cardCount: 3,
  },
  {
    num: '02',
    title: 'Still & Motion',
    href: '/services/still-motion',
    accent: '#f9b311',
    description:
      'Photography, videography, animation, and post-production, handled by a full in-house team that plans, shoots, edits, and delivers production-ready content. Every frame intentional.',
    tags: ['Photography', 'Videography', 'Animation', 'Motion Graphics', 'Post-Production'],
    serviceNames: ['Photography', 'Videography', 'Animation', 'Motion Graphics', 'Post-Production'],
    cardCount: 3,
  },
  {
    num: '03',
    title: 'Communication',
    href: '/services/communication',
    accent: '#004c95',
    description:
      'Strategy, content, and distribution orchestrated to reach the right people, saying the right thing, at the right moment. From monthly social management to full campaign rollouts.',
    tags: ['Social Media', 'Digital Marketing', 'Content Strategy', 'Campaign Management', 'Media Planning'],
    serviceNames: ['Social Media', 'Digital Marketing', 'Campaign Management'],
    cardCount: 3,
  },
]

function pickProjects(all: Project[], serviceNames: string[], n: number) {
  const matched = all.filter((p) => p.services?.some((s) => serviceNames.includes(s)))
  const pool = matched.length >= n ? matched : [...matched, ...all]
  // de-dupe while preserving order
  const seen = new Set<string>()
  const unique: Project[] = []
  for (const p of pool) {
    if (!seen.has(p._id)) {
      seen.add(p._id)
      unique.push(p)
    }
  }
  return unique.slice(0, n)
}

/* Project card — identical to the homepage SelectedWorks card */
function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={`/work/${project.slug?.current}`} className="group block">
      {/* Card container — fixed aspect, overflow hidden */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-bg-card">
        {project.thumbnailType === 'video' && project.thumbnailVideo ? (
          <iframe
            src={`https://player.vimeo.com/video/${project.thumbnailVideo.match(/vimeo\.com\/(\d+)/)?.[1]}?background=1&autoplay=1&loop=1&muted=1`}
            className="pointer-events-none absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:-translate-y-[calc(50%+48px)]"
            style={{ border: 'none' }}
            allow="autoplay; fullscreen"
            loading="lazy"
          />
        ) : project.thumbnail?.asset ? (
          <Image
            loader={sanityImageLoader}
            src={urlFor(project.thumbnail).width(1200).height(900).url()}
            alt={project.name}
            fill
            loading="lazy"
            className="object-cover md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-bg-card">
            <div className="h-[60px] w-[60px] rounded-full border-2 border-text-tertiary" />
          </div>
        )}

        {/* Info panel — grows up from bottom on hover (desktop only) */}
        <div className="absolute bottom-0 left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-4 pb-4 transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block">
          {project.client && (
            <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
              {project.client}
            </span>
          )}
          <h3 className="mt-1.5 font-display text-[1.15rem] font-semibold uppercase text-text-primary">
            {project.tagline || project.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {project.industry && (
              <span className="rounded-[var(--radius-pill)] bg-white/10 px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                {project.industry}
              </span>
            )}
            {project.services?.map((service) => (
              <span
                key={service}
                className="rounded-[var(--radius-pill)] border border-border px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
              >
                {service}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile info — always visible below card */}
      <div className="mt-3 md:hidden">
        {project.client && (
          <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
            {project.client}
          </span>
        )}
        <h3 className="mt-1 font-display text-[1rem] font-semibold uppercase text-text-primary">
          {project.tagline || project.name}
        </h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {project.industry && (
            <span className="rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
              {project.industry}
            </span>
          )}
          {project.services?.map((service) => (
            <span
              key={service}
              className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
            >
              {service}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}

function ServiceSection({ section, projects }: { section: Section; projects: Project[] }) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const items = pickProjects(projects, section.serviceNames, section.cardCount)

  return (
    <section
      ref={ref}
      className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)]"
      style={{ ['--accent' as string]: section.accent }}
    >
      <div className="mx-auto max-w-[var(--max-width)]">
        {/* Header — number left, heading + copy + tags right */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
          <motion.div
            className="md:col-span-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="font-display text-[0.95rem] font-semibold tracking-[0.05em] text-text-tertiary">
              ({section.num})
            </span>
          </motion.div>

          <div className="md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link href={section.href} className="group inline-block">
                <h2 className="font-display text-[clamp(2rem,4.5vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] transition-colors duration-300 group-hover:text-[var(--accent)]">
                  {section.title}
                </h2>
              </Link>
            </motion.div>

            <motion.p
              className="mt-6 max-w-[540px] text-[0.95rem] leading-[1.7] text-text-secondary"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              {section.description}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-wrap gap-2.5"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {section.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[var(--radius-pill)] border border-border px-4 py-2 text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Project cards */}
        <motion.div
          className={`mt-[var(--space-xl)] grid gap-5 ${
            items.length >= 3 ? 'md:grid-cols-3' : items.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-1'
          }`}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {items.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Manifesto hero (from the current /services page) ── */
function WordItem({
  word,
  range,
  progress,
}: {
  word: string
  range: [number, number]
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const opacity = useTransform(progress, range, [0.15, 1])
  const y = useTransform(progress, range, [4, 0])
  return (
    <motion.span style={{ opacity, y }} className="mr-[0.3em] inline-block">
      {word}
    </motion.span>
  )
}

function WordReveal({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.4'],
  })
  const words = text.split(' ')
  return (
    <span ref={ref}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return <WordItem key={i} word={word} range={[start, end]} progress={scrollYProgress} />
      })}
    </span>
  )
}

/* ── Editorial vertical process timeline (from the current /services page) ── */
const PROCESS_STEPS = [
  { number: '01', title: 'Discovery & Brief', description: 'We listen before we create. Deep immersion into your brand, audience, competitors, and goals to build a brief worth building from.' },
  { number: '02', title: 'Strategy & Direction', description: 'Insights become a strategic foundation — positioning, messaging hierarchy, creative direction, and a clear plan of action.' },
  { number: '03', title: 'Creative Development', description: 'Concepts, iterations, and refinement. We present, collaborate, and push until the work is something we\'re both proud of.' },
  { number: '04', title: 'Production & Delivery', description: 'Pixel-perfect execution across every deliverable. Print, digital, motion — everything ships production-ready, on time.' },
  { number: '05', title: 'Ongoing Partnership', description: 'Great brands evolve. We stay close to help you adapt, grow, and keep the work as sharp as the day it launched.' },
]

function ProcessRow({ step, index }: { step: typeof PROCESS_STEPS[number]; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rowRef, { once: true, margin: '-15%' })
  return (
    <motion.div
      ref={rowRef}
      className="group grid grid-cols-12 items-start gap-6 border-t py-12 md:gap-10 md:py-16"
      style={{ borderColor: 'var(--border)' }}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 * index }}
    >
      <div className="col-span-12 md:col-span-3">
        <span className="font-display text-[clamp(4rem,9vw,8rem)] font-bold leading-[0.9] tracking-[-0.04em] text-text-tertiary/30 transition-colors duration-500 group-hover:text-accent">
          {step.number}
        </span>
      </div>
      <div className="col-span-12 md:col-span-9 md:flex md:gap-12">
        <h4 className="mb-4 font-display text-[clamp(1.4rem,2.4vw,2rem)] font-bold leading-[1.1] tracking-[-0.02em] md:mb-0 md:w-[40%] md:max-w-[320px]">
          {step.title}
        </h4>
        <p className="text-[0.95rem] leading-[1.7] text-text-secondary md:w-[60%] md:max-w-[520px]">
          {step.description}
        </p>
      </div>
    </motion.div>
  )
}

function ProcessSection() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <section ref={ref} className="border-t border-border px-[var(--gutter)] pt-12 pb-0 md:pt-16">
      <div className="mx-auto max-w-[var(--max-width)]">
        <div className="mb-16 md:mb-20">
          <motion.p
            className="mb-6 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
          >
            Process
          </motion.p>
          <motion.h2
            className="font-display text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            How every BoldCrest project works<span className="text-accent">.</span>
          </motion.h2>
        </div>
        <div>
          {PROCESS_STEPS.map((step, i) => (
            <ProcessRow key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ── Client Logos (column-shift carousel, from the current /services page) ── */
const CLIENT_NAMES = [
  'Hako', 'JokaDent', 'AK Invest', 'Magniflex', 'Palma',
  'Tepelene', 'LoriCaffe', 'Tirana Home Store', 'Fentimans', 'Diamond',
  'Akses', 'ExpertCloud', 'Anmetal', 'Wienna', 'Baboon',
  'Berdica', 'Perfect Fashion', 'Alisadudaj', 'Matrix', 'Red Bull',
  'Allure Beauty', 'Primera', 'WECA', 'Plenty', 'Tierr',
  'Noble Cigars', 'Bazhur', 'Borghese', 'Albita', 'Karrige Pogradeci',
  "Ina's Farm", 'EOS Mezze', 'NFMA', 'Baboon Delivery', 'Magniflex Albania',
]

function ClientLogos() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [colOffset, setColOffset] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  const COLS_VISIBLE = 5
  const ROWS = 4

  const columns: string[][] = []
  for (let i = 0; i < CLIENT_NAMES.length; i += ROWS) {
    columns.push(CLIENT_NAMES.slice(i, i + ROWS))
  }
  const maxOffset = Math.max(0, columns.length - COLS_VISIBLE)
  const canPrev = colOffset > 0
  const canNext = colOffset < maxOffset

  const next = () => setColOffset((o) => Math.min(o + 1, maxOffset))
  const prev = () => setColOffset((o) => Math.max(o - 1, 0))

  return (
    <section ref={ref} className="px-[var(--gutter)] pt-6 pb-12">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.div
          className="mb-[var(--space-lg)]"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Trusted by the ambitious<span className="text-accent">.</span>
          </p>
          <div className="h-px w-full bg-border" />
        </motion.div>

        <div className="overflow-hidden [--logos-gap:1.5rem] md:[--logos-gap:2.5rem]">
          <div
            className="flex transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{
              gap: 'var(--logos-gap)',
              transform: `translateX(calc(-1 * ${colOffset} * ((100% - 4 * var(--logos-gap)) / 5 + var(--logos-gap))))`,
            }}
            onMouseLeave={() => setHovered(null)}
          >
            {columns.map((col, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col gap-y-12 md:gap-y-16"
                style={{ width: 'calc((100% - 4 * var(--logos-gap)) / 5)' }}
              >
                {col.map((name) => (
                  <span
                    key={name}
                    className="flex cursor-default items-center justify-center px-2 py-4 transition-opacity duration-300"
                    style={{ opacity: hovered ? (hovered === name ? 1 : 0.2) : 0.5 }}
                    onMouseEnter={() => setHovered(name)}
                  >
                    <span className="font-display text-[clamp(1.2rem,2vw,1.7rem)] font-semibold uppercase tracking-[0.08em]">
                      {name}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex items-center justify-end gap-3">
          <button
            onClick={prev}
            aria-label="Previous logos"
            disabled={!canPrev}
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 hover:border-white/40 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--border)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            onClick={next}
            aria-label="Next logos"
            disabled={!canNext}
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors duration-300 hover:border-white/40 disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--border)]"
            style={{ borderColor: 'var(--border)' }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}

export default function ServicesSampleClient({
  projects,
  faqItems = [],
}: {
  projects: Project[]
  faqItems?: FAQItem[]
}) {
  return (
    <main className="relative">
      {/* ── Hero (Manifesto) — same as the current /services page ── */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0">
        <div>
          <motion.p
            className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            Services
          </motion.p>
          <motion.h1
            className="font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="block"><WordReveal text="We craft brands" /></span>
            <span className="block"><WordReveal text="and tell stories" /></span>
            <span className="block"><WordReveal text="that don't just inform." /></span>
            <span className="block"><WordReveal text="They pull people in." /></span>
          </motion.h1>
        </div>
        <div className="mt-10 md:mt-12 lg:mt-16">
          <div className="h-px w-full bg-border" />
        </div>
      </section>

      {/* Numbered discipline sections */}
      {SECTIONS.map((section) => (
        <ServiceSection key={section.num} section={section} projects={projects} />
      ))}

      {/* Process timeline */}
      <ProcessSection />

      {/* Client logos */}
      <ClientLogos />

      {/* FAQ — same treatment as the service pages */}
      {faqItems.length > 0 && (
        <FAQSection heading="Questions We Hear Most" items={faqItems} noTopBorder grayBg />
      )}
    </main>
  )
}
