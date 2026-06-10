'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView } from 'framer-motion'
import Link from 'next/link'
import { CTAButton } from '@/components/MagneticButton'
import FAQSection from '@/components/services/FAQSection'

interface Service {
  _id: string
  name: string
  slug: { current: string }
  category: string
  order: number
}

interface CategoryGroup {
  category: string
  services: Service[]
}

interface FAQItem {
  question: string
  answer: string
}

interface ServicesPageClientProps {
  categories: CategoryGroup[]
  faqItems?: FAQItem[]
}

const capabilities = [
  {
    category: 'Brand Dev',
    number: '01',
    color: '#DA291C',
    heading: 'Brand\nDevelopment',
    abbr: 'BRND DEV',
    href: '/services/brand-development',
    ctaLabel: 'Explore',
    tags: [
      'Visual Identity',
      'Packaging Design',
      'Creative Advertising',
      'Brand Strategy',
      'Logo Design',
      'Brand Guidelines',
    ],
    description:
      "From brand architecture to visual identity, we create systems that clarify who you are and amplify how you're seen. Whether it's a startup's first logo or a national brand's complete identity overhaul.",
  },
  {
    category: 'Still & Motion',
    number: '02',
    color: '#f9b311',
    heading: 'Still &\nMotion',
    abbr: 'STL & MTN',
    href: '/services/still-motion',
    ctaLabel: 'Explore',
    tags: [
      'Photography',
      'Videography',
      'Animation',
      'Motion Graphics',
      'Post-Production',
      'Color Grading',
    ],
    description:
      'Still frames that hold attention. Moving images that move people. Every shoot, every cut, every grade, deliberate. We handle the full production cycle, all in-house.',
  },
  {
    category: 'Communications',
    number: '03',
    color: '#004c95',
    heading: 'Communications',
    abbr: 'COMMS',
    href: '/services/communication',
    ctaLabel: 'Explore',
    tags: [
      'Social Media',
      'Digital Marketing',
      'Public Relations',
      'Content Strategy',
      'Campaign Management',
      'Media Planning',
    ],
    description:
      "A great brand in silence is a waste. We put yours where it belongs, in front of the right people, saying the right thing, at the right moment.",
  },
]

/* ── Word-by-word reveal ── */
function WordReveal({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.4'],
  })

  const words = text.split(' ')

  return (
    <span ref={ref} className={className}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return (
          <WordItem
            key={i}
            word={word}
            range={[start, end]}
            progress={scrollYProgress}
          />
        )
      })}
    </span>
  )
}

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
    <motion.span
      style={{ opacity, y }}
      className="mr-[0.3em] inline-block"
    >
      {word}
    </motion.span>
  )
}

/* ── Expandable Service Cards ── */
function ServiceShowcase({ categories }: { categories: CategoryGroup[] }) {
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <section
      ref={ref}
      className="px-[var(--gutter)] pt-8 pb-[120px] md:pt-10"
    >
      <div>
      {/* Section header */}
      <motion.p
        className="mb-10 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
      >
        Disciplines
      </motion.p>

      {/* Cards */}
      <motion.div
        className="flex h-[480px] gap-3 md:h-[640px]"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        {capabilities.map((cap, i) => {
          const isActive = active === i
          const sanityServices =
            categories.find((c) => c.category === cap.category)?.services || []
          const tags =
            sanityServices.length > 0
              ? sanityServices.map((s) => s.name)
              : cap.tags

          const darkShade = `color-mix(in srgb, ${cap.color} 50%, black)`

          return (
            <motion.div
              key={cap.category}
              className="relative cursor-pointer overflow-hidden rounded-xl"
              style={{ background: cap.color }}
              animate={{ flex: isActive ? 5 : 0.85 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => setActive(i)}
            >
              {/* Collapsed state */}
              <motion.div
                className="absolute inset-0 flex flex-col"
                animate={{ opacity: isActive ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                style={{ pointerEvents: isActive ? 'none' : 'auto' }}
              >
                <span className="sr-only">{cap.number}</span>
                <div className="flex flex-1 items-start justify-center pt-10 md:pt-12">
                  <span
                    className="font-display text-[clamp(1.3rem,1.9vw,1.9rem)] font-bold tracking-[-0.01em]"
                    style={{
                      writingMode: 'vertical-rl',
                      color: darkShade,
                    }}
                  >
                    {cap.category}
                  </span>
                </div>
                <div
                  className="flex h-[110px] items-center justify-center md:h-[130px]"
                  style={{ background: darkShade }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 4v16M4 12h16" stroke={cap.color} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </motion.div>

              {/* Expanded state */}
              <motion.div
                className="absolute inset-0"
                animate={{ opacity: isActive ? 1 : 0 }}
                transition={{ duration: 0.4, delay: isActive ? 0.2 : 0 }}
                style={{ pointerEvents: isActive ? 'auto' : 'none' }}
              >
                {/* Entire expanded card behaves as the link */}
                <Link
                  href={cap.href}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`${cap.category} — ${cap.ctaLabel}`}
                  className="group flex h-full flex-col"
                >
                {/* Top body */}
                <div className="flex flex-1 flex-col justify-between p-8 md:p-12">
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <h3
                      className="font-display text-[clamp(2rem,4.2vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.02em]"
                      style={{ color: darkShade, whiteSpace: 'pre-line' }}
                    >
                      {cap.heading}
                    </h3>
                    <div className="flex flex-wrap gap-2 md:max-w-[55%] md:justify-end">
                      {tags.slice(0, 6).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.08em]"
                          style={{ borderColor: darkShade, color: darkShade }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p
                    className="max-w-[520px] text-[0.9rem] leading-[1.7]"
                    style={{ color: darkShade }}
                  >
                    {cap.description}
                  </p>
                </div>

                {/* Dark bottom bar — EXPLORE */}
                <div
                  className="flex h-[110px] items-center px-8 md:h-[130px] md:px-12"
                  style={{ background: darkShade }}
                >
                  <span
                    className="inline-flex items-center gap-3 text-[0.95rem] font-semibold uppercase tracking-[0.2em]"
                    style={{ color: cap.color }}
                  >
                    <span>{cap.ctaLabel}</span>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="transition-transform duration-300 group-hover:translate-x-1">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                </Link>
              </motion.div>
            </motion.div>
          )
        })}
      </motion.div>
      </div>
    </section>
  )
}

/* ── Stats Bar + Editorial Testimonial ── */
const ACTIVE_SINCE = new Date('2019-01-27T00:00:00')

/* Auto-incrementing counters — anchored at a base date with base values, then
   grown by real elapsed time: Projects +1 every 10 days, Partners +1 / month. */
const COUNTER_BASE = new Date('2026-06-10T00:00:00')
const BASE_PROJECTS = 248
const BASE_PARTNERS = 92

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

function monthsSince(date: Date): number {
  const now = new Date()
  let months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth())
  if (now.getDate() < date.getDate()) months -= 1
  return Math.max(0, months)
}

function CountUp({ to, active }: { to: number; active: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) return
    let frame: number
    const duration = 1800
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setN(Math.round(eased * to))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, to])
  return <>{n.toLocaleString('en-US')}</>
}

function Stats() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [counts, setCounts] = useState({
    projects: BASE_PROJECTS,
    partners: BASE_PARTNERS,
    days: 0,
  })

  useEffect(() => {
    const update = () =>
      setCounts({
        projects: BASE_PROJECTS + Math.floor(daysSince(COUNTER_BASE) / 10),
        partners: BASE_PARTNERS + monthsSince(COUNTER_BASE),
        days: daysSince(ACTIVE_SINCE),
      })
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  const stats = [
    { value: counts.projects, label: 'Projects delivered', bg: '#1f1f1f' },
    { value: counts.partners, label: 'Partners', bg: '#171717' },
    { value: counts.days, label: 'Days active', bg: '#0f0f0f' },
  ]

  return (
    <section ref={ref} className="px-[var(--gutter)] py-12 md:py-16">
      <div className="mx-auto max-w-[var(--max-width)]">
        <motion.div
          className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col justify-between gap-10 rounded-2xl p-8 md:p-10 md:min-h-[300px]"
              style={{ background: s.bg }}
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                {s.label}
              </p>
              <div className="font-display text-[clamp(3.5rem,8vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em]">
                <CountUp to={s.value} active={isInView} />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

/* ── Client Logos (homepage-style two-row marquee) ── */
const CLIENT_NAMES = [
  'Hako', 'JokaDent', 'AK Invest', 'Magniflex', 'Palma',
  'Tepelene', 'LoriCaffe', 'Tirana Home Store', 'Fentimans', 'Diamond',
  'Akses', 'ExpertCloud', 'Anmetal', 'Wienna', 'Baboon',
  'Berdica', 'Perfect Fashion', 'Alisadudaj', 'Matrix', 'Red Bull',
  'Allure Beauty', 'Primera', 'WECA', 'Plenty', 'Tierr',
  'Noble Cigars', 'Bazhur', 'Borghese', 'Albita', 'Karrige Pogradeci',
  'Ina\'s Farm', 'EOS Mezze', 'NFMA', 'Baboon Delivery', 'Magniflex Albania',
]

function ClientLogos() {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [colOffset, setColOffset] = useState(0)
  const [hovered, setHovered] = useState<string | null>(null)

  const COLS_VISIBLE = 5
  const ROWS = 4

  // Group names into vertical columns of ROWS items each
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
    <section ref={ref} className="px-[var(--gutter)] pt-20 pb-12">
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

        {/* Slidable column track — viewport shows COLS_VISIBLE columns; arrows shift one column */}
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
                    style={{
                      opacity: hovered ? (hovered === name ? 1 : 0.2) : 0.5,
                    }}
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

        {/* Arrow controls (no indicator) */}
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

        {/* Bottom hairline — mirrors the one above the grid */}
        <div className="mt-[var(--space-lg)] h-px w-full bg-border" />
      </div>
    </section>
  )
}

const PROCESS_STEPS = [
  { number: '01', title: 'Discovery & Brief', description: 'We listen before we create. Deep immersion into your brand, audience, competitors, and goals to build a brief worth building from.' },
  { number: '02', title: 'Strategy & Direction', description: 'Insights become a strategic foundation — positioning, messaging hierarchy, creative direction, and a clear plan of action.' },
  { number: '03', title: 'Creative Development', description: 'Concepts, iterations, and refinement. We present, collaborate, and push until the work is something we\'re both proud of.' },
  { number: '04', title: 'Production & Delivery', description: 'Pixel-perfect execution across every deliverable. Print, digital, motion — everything ships production-ready, on time.' },
  { number: '05', title: 'Ongoing Partnership', description: 'Great brands evolve. We stay close to help you adapt, grow, and keep the work as sharp as the day it launched.' },
]

/* ── Editorial Vertical Process Timeline ── */
function ProcessRow({ step, index }: { step: typeof PROCESS_STEPS[number]; index: number }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rowRef, { once: true, margin: '-15%' })

  return (
    <motion.div
      ref={rowRef}
      className="grid grid-cols-12 items-start gap-6 border-t py-12 md:gap-10 md:py-16"
      style={{ borderColor: 'var(--border)' }}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.05 * index }}
    >
      {/* Number — huge, accent-tinted */}
      <div className="col-span-12 md:col-span-3">
        <span
          className="font-display text-[clamp(4rem,9vw,8rem)] font-bold leading-[0.9] tracking-[-0.04em] text-text-tertiary/30 transition-colors duration-500 group-hover:text-accent"
        >
          {step.number}
        </span>
      </div>

      {/* Title + description */}
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
    <section ref={ref} className="px-[var(--gutter)] pt-12 pb-[120px] md:pt-16">
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

        {/* Steps — vertical editorial rows with hairline dividers */}
        <div className="border-b" style={{ borderColor: 'var(--border)' }}>
          {PROCESS_STEPS.map((step, i) => (
            <ProcessRow key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function ServicesPageClient({
  categories,
  faqItems,
}: ServicesPageClientProps) {
  return (
    <main className="relative">
      {/* ── Hero (Manifesto) ── */}
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
        {/* Divider */}
        <div className="mt-10 md:mt-12 lg:mt-16">
          <div className="h-px w-full bg-border" />
        </div>
      </section>

      {/* ── Service Showcase Cards ── */}
      <ServiceShowcase categories={categories} />

      {/* ── Process Timeline ── */}
      <ProcessSection />

      {/* ── Stats + Testimonial ── */}
      <Stats />

      {/* ── Client Logos ── */}
      <ClientLogos />

      {/* ── FAQ ── */}
      {faqItems && faqItems.length > 0 && (
        <FAQSection
          heading="Questions We Hear Most"
          items={faqItems}
          noTopBorder
          grayBg
        />
      )}
    </main>
  )
}
