'use client'

import { useTranslations } from 'next-intl'

import { useRef, useState, useEffect } from 'react'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { InlineButton } from '@/components/MagneticButton'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import { categoryColor } from '@/lib/diaryCategories'

interface TeamMember {
  _id: string
  name: string
  role?: string
  image?: { asset: { _ref: string } }
}

interface DiaryPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  publishedAt?: string
  coverImage?: { asset?: { _ref?: string } }
}

interface BottomSectionsProps {
  members: TeamMember[]
  diaryPosts: DiaryPost[]
}

const ACCENT_COLORS = ['#DA291C', '#f9b311', '#004c95', '#DA291C']

/* ── Word-by-word reveal ── */
function WordReveal({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.9', 'start 0.35'],
  })
  const words = text.split(' ')
  return (
    <span ref={ref}>
      {words.map((word, i) => {
        const start = i / words.length
        const end = start + 1 / words.length
        return <RevealWord key={i} word={word} range={[start, end]} progress={scrollYProgress} />
      })}
    </span>
  )
}

function RevealWord({
  word,
  range,
  progress,
}: {
  word: string
  range: [number, number]
  progress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const opacity = useTransform(progress, range, [0.12, 1])
  return (
    <motion.span style={{ opacity }} className="mr-[0.3em] inline-block">
      {word}
    </motion.span>
  )
}

/* ── Team strip: stacked portraits (left 40%) + pull quote (right 60%) ── */
function TeamStrip({ members }: { members: TeamMember[] }) {
  const t = useTranslations('Home')
  // Desktop headline carries a button INSIDE the sentence; translators marked
  // its place with ⟦ ⟧ so word order can differ per language.
  const [egosBefore, egosButton = '', egosAfter = ''] = t('noEgos').split(/⟦|⟧/)
  // A random 4 of the whole team, re-picked on each load (set in the mount
  // effect below) so the strip isn't always the same first four — over refreshes
  // everyone gets a turn. Empty until mounted, which also avoids a hydration
  // mismatch since the faces only render client-side.
  const [faces, setFaces] = useState<TeamMember[]>([])
  const [mounted, setMounted] = useState(false)
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState<number | null>(null)
  // Only react to hover where a real hover-capable pointer exists (mouse/
  // trackpad — incl. an iPad with a mouse). On touch-only screens this stays
  // false, so a finger scrolling vertically over the cards can't trigger the
  // hover-scale, which read as a glitch over the staff photos on mobile.
  const [canHover, setCanHover] = useState(false)
  useEffect(() => {
    setCanHover(window.matchMedia('(any-hover: hover)').matches)
  }, [])

  useEffect(() => {
    setMounted(true)
    // Fisher-Yates shuffle, then take 4 — fresh random combination per load.
    const pool = [...members]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    setFaces(pool.slice(0, 4))
  }, [members])

  useEffect(() => {
    if (!mounted || faces.length === 0) return
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % faces.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [mounted, faces.length])

  // Stacked rotations & offsets — mimicking ServiceCards' fanned state
  const rotations = [-8, -3, 3, 8]
  const offsets = [-50, -18, 18, 50]

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)

  return (
    <section className="px-[var(--gutter)] py-[var(--space-2xl)]">
      <div className="mx-auto flex max-w-[var(--max-width)] flex-col items-center gap-12 md:flex-row md:items-center md:gap-8">
        {/* Left: headline + body text — 55% */}
        <motion.div
          className="order-2 w-full md:order-1 md:w-[55%]"
          // One-shot reveal via IntersectionObserver (whileInView), NOT
          // scroll-linked. The previous useScroll/useTransform version read
          // layout on every scroll frame; on mobile's native scroll that caused
          // a small catch-up "jump" each time the trigger zone was entered/left
          // (once down, once back up). This plays the same fade + slide once and
          // is fully decoupled from scroll position — same look, no jump.
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Desktop — inline button. Color tracks --zone-fg so the headline
              stays readable while the page bg is mid-transition (dark text on the
              light band, light text once the bg returns dark) — same scroll-synced
              foreground the diary cards above use; fallback to light pre-JS. */}
          <p
            className="mb-6 hidden font-display text-[clamp(2.5rem,6vw,6rem)] font-bold leading-[1.1] tracking-[-0.03em] md:block"
            style={{ color: 'var(--zone-fg, #EDEDED)' }}
          >
            {egosBefore}
            <InlineButton href="/people" label={egosButton} showArrow adaptive />
            {egosAfter}
          </p>

          {/* Mobile — text + paragraph + full-width button */}
          <div className="mb-6 md:hidden">
            <p
              className="font-display text-[clamp(2.5rem,10vw,4rem)] font-bold leading-[1.1] tracking-[-0.03em]"
              style={{ color: 'var(--zone-fg, #EDEDED)' }}
            >
              {t('noEgosMobile')}
            </p>
            <p
              className="mt-5 text-[1rem] leading-[1.75]"
              style={{ color: 'var(--zone-fg-muted, rgba(237,237,237,0.45))' }}
            >
              {t('teamDesc')}
            </p>
            <Link
              href="/people"
              className="mt-8 flex w-1/2 items-center justify-between gap-2 whitespace-nowrap rounded-full border px-5 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.04em]"
              // Pill follows the bg tone so it transitions with everything else:
              // BLACK pill + light text on the dark bg, flipping to a WHITE pill +
              // dark text on the light transition band. Fill = --zone-bg, text =
              // --zone-contrast, border = faint contrast. NO css transition — it
              // tracks the scroll in lockstep with the "No egos" headline (same as
              // the desktop "The Team" adaptive pill).
              style={{ backgroundColor: 'var(--zone-bg, #0a0a0a)', color: 'var(--zone-contrast, #EDEDED)', borderColor: 'var(--zone-contrast-faint, rgba(237,237,237,0.3))' }}
            >
              {t('meetThePeople')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Desktop paragraph */}
          <p
            className="hidden max-w-[520px] text-[1.05rem] leading-[1.75] md:block"
            style={{ color: 'var(--zone-fg-muted, rgba(237,237,237,0.45))' }}
          >
            {t('teamDesc')}
          </p>
        </motion.div>

        {/* Right: stacked portrait cards — 45% */}
        <div className="order-1 flex w-full justify-center md:order-2 md:w-[45%] md:justify-end">
          {mounted && faces.length > 0 ? (
            <div
              className="relative"
              style={{ width: 340, height: 420 }}
            >
              {faces.map((face, i) => {
                const isActive = i === active
                const isHovered = hovered === i
                const hasImage = !!face.image?.asset?._ref
                const color = ACCENT_COLORS[i % ACCENT_COLORS.length]

                return (
                  <motion.div
                    key={face._id}
                    className="absolute left-1/2 top-0 h-[400px] w-[260px] cursor-pointer overflow-hidden rounded-2xl border-2 border-white/[0.06]"
                    style={{ marginLeft: -130 }}
                    animate={{
                      rotate: rotations[i] ?? 0,
                      x: offsets[i] ?? 0,
                      scale: isActive ? 1.05 : 0.95,
                      zIndex: isActive ? 10 : faces.length - i,
                    }}
                    whileHover={canHover ? { scale: 1.1, zIndex: 20, rotate: 0 } : undefined}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    onMouseEnter={canHover ? () => setHovered(i) : undefined}
                    onMouseLeave={canHover ? () => setHovered(null) : undefined}
                  >
                    {hasImage ? (
                      <Image
                        src={urlFor(face.image!).width(520).height(800).url()}
                        alt={face.name}
                        width={260}
                        height={400}
                        loader={sanityImageLoader}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-[1.2rem] font-bold tracking-wider text-white"
                        style={{ backgroundColor: color }}
                      >
                        {getInitials(face.name)}
                      </div>
                    )}

                    {/* Name overlay on hover */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-3 pb-3 pt-10"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-[0.75rem] font-semibold text-white">
                            {face.name}
                          </p>
                          {face.role && (
                            <p className="text-[0.6rem] uppercase tracking-[0.1em] text-white/60">
                              {face.role}
                            </p>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </div>
          ) : (
            <div style={{ width: 340, height: 420 }} />
          )}
        </div>

      </div>
    </section>
  )
}

/* ServicesCTA removed — "Three disciplines" block deleted */

/* ── Diary — two posts visible, slide to next two ── */
const PLACEHOLDER_POSTS: DiaryPost[] = [
  {
    _id: 'p1',
    title: 'Why your brand needs a point of view',
    slug: { current: 'brand-point-of-view' },
    excerpt: 'A logo isn\'t a brand. A brand is the feeling people carry after every interaction. Here\'s how we build that feeling from scratch.',
    category: 'Branding',
    publishedAt: '2026-03-10',
  },
  {
    _id: 'p2',
    title: 'The death of safe design',
    slug: { current: 'death-of-safe-design' },
    excerpt: 'Playing it safe is the riskiest move in a crowded market. We break down why bold creative consistently outperforms the forgettable.',
    category: 'Design',
    publishedAt: '2026-02-28',
  },
  {
    _id: 'p3',
    title: 'Motion is the new typography',
    slug: { current: 'motion-new-typography' },
    excerpt: 'Static brands are invisible brands. How motion design became the most important layer of modern identity systems.',
    category: 'Motion',
    publishedAt: '2026-02-15',
  },
  {
    _id: 'p4',
    title: 'Campaigns that outlive the algorithm',
    slug: { current: 'campaigns-outlive-algorithm' },
    excerpt: 'Social platforms change daily. We build communication strategies anchored to human truths, not trending formats.',
    category: 'Strategy',
    publishedAt: '2026-01-30',
  },
]

/* ── Diary card ──
   The card is a <div> (not one big <Link>) so the category pill can be its own
   link to the filtered diary view without nesting <a> inside <a>. The image,
   title and excerpt link to the post; the pill links to /diary?category=… */
function DiaryCardImage({ post, index }: { post: DiaryPost; index: number }) {
  const color = categoryColor(post.category)
  const hasImage = !!post.coverImage?.asset?._ref
  const postHref = `/diary/${post.slug.current}`

  return (
    <div className="group block">
      {/* Image container */}
      <Link href={postHref} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#1a1a1a] md:rounded-2xl">
          {hasImage ? (
            <Image
              src={urlFor(post.coverImage!).width(800).height(800).url()}
              alt={post.title}
              fill
              loader={sanityImageLoader}
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            /* Placeholder — shown when no cover image is set */
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-[1.2rem] font-bold uppercase leading-[1.1] tracking-[-0.02em] text-white/10 text-center px-4 md:text-[3rem] md:px-8">
                {post.title}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Info below image */}
      <div className="mt-3 px-0.5 md:mt-5 md:px-1">
        {/* Category pill — neutral by default, category color on hover. Links to
            the diary grid pre-filtered to this category. */}
        {post.category && (
          <Link
            href={`/diary?category=${encodeURIComponent(post.category)}`}
            className="category-pill mb-2 inline-block rounded-[var(--radius-pill)] border px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.12em] transition-all duration-200 md:mb-3 md:px-3 md:py-1 md:text-[0.6rem]"
            style={{ borderColor: 'var(--zone-fg-half)', color: 'var(--zone-fg-half)' }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = color
              el.style.borderColor = color
              el.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.backgroundColor = 'transparent'
              el.style.borderColor = 'var(--zone-fg-half)'
              el.style.color = 'var(--zone-fg-half)'
            }}
          >
            {post.category}
          </Link>
        )}

        {/* Title + excerpt link to the post */}
        <Link href={postHref} className="block">
          <h3 className="font-display text-[0.7rem] font-bold uppercase leading-[1.3] tracking-[0.02em] transition-colors duration-200 md:text-[clamp(1rem,1.5vw,1.3rem)]" style={{ color: 'var(--zone-fg)' }}>
            {post.title}
          </h3>

          {/* Excerpt — hidden on mobile */}
          {post.excerpt && (
            <p className="mt-2 line-clamp-2 hidden text-[0.8rem] leading-[1.6] md:block" style={{ color: 'var(--zone-fg-muted)' }}>
              {post.excerpt}
            </p>
          )}
        </Link>
      </div>
    </div>
  )
}

function DiarySection({ posts }: { posts: DiaryPost[] }) {
  const t = useTranslations('Home')
  const entries = posts.length > 0 ? posts.slice(0, 4) : PLACEHOLDER_POSTS
  const isInView = useInView(useRef<HTMLDivElement>(null), { once: true, margin: '-100px' })
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-100px' })

  return (
    <div ref={sectionRef} className="relative pt-[var(--space-sm)] pb-[var(--space-2xl)] md:pt-[var(--space-xl)]">
      {/* Diary header — matching Selected Works style */}
      <div className="px-[var(--gutter)]">
        <div className="mb-[var(--space-lg)] flex items-center justify-between">
          <h2 className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--zone-fg-half)' }}>
            {t('theDiary')}
          </h2>
          <Link
            href="/diary"
            className="group/link flex items-center gap-2 text-[0.75rem] font-semibold uppercase tracking-[0.15em] transition-all duration-[0.5s] hover:gap-3"
            style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)', color: 'var(--zone-fg-muted)' }}
          >
            <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
              <span className="flex flex-col transition-transform duration-[0.5s] group-hover/link:-translate-y-1/2" style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}>
                <span className="leading-[1.2]">{t('seeAll')}</span>
                <span className="leading-[1.2]">{t('seeAll')}</span>
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform duration-[0.5s] group-hover/link:translate-x-1" style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="mx-[var(--gutter)] mb-[var(--space-lg)] h-px" style={{ backgroundColor: 'var(--zone-border)' }} />

      {/* Post grid — 2-up on mobile, 4 in one row on desktop */}
      <div className="grid grid-cols-2 gap-3 px-[var(--gutter)] sm:gap-6 md:grid-cols-4 md:gap-5">
        {entries.map((post, i) => (
          <motion.div
            key={post._id}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.7,
              delay: 0.15 + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <DiaryCardImage post={post} index={i} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ── 2. People CTA ── */
function PeopleSection() {
  return null
}


/* ── 4. Coffee CTA ── */
function CoffeeCTA() {
  const t = useTranslations('Home')
  const [cBefore, cButton = '', cAfter = ''] = t('coffee').split(/⟦|⟧/)
  return (
    <section className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)] md:py-[var(--space-3xl)]">
      <div className="mx-auto max-w-[var(--max-width)]">
        <div className="flex flex-col items-center text-center">
          <p className="mb-4 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary md:mb-6 md:text-[0.75rem]">
            {t('whatWaiting')}
          </p>
          <p className="font-display text-[clamp(2rem,8vw,8rem)] font-bold leading-[1.1] tracking-[-0.03em]">
            {cBefore}
            <InlineButton href="/contact" label={cButton} showArrow />
            {cAfter}
          </p>
        </div>
      </div>
    </section>
  )
}

/** Diary only — lives inside the ColorTransitionZone */
export function HomeDiary({ diaryPosts }: { diaryPosts: DiaryPost[] }) {
  return <DiarySection posts={diaryPosts} />
}

/** Team + Coffee CTA — lives outside the ColorTransitionZone (dark bg) */
export default function BottomSections({ members }: { members: TeamMember[] }) {
  return (
    <>
      <PeopleSection />
      <TeamStrip members={members} />
      <CoffeeCTA />
    </>
  )
}
