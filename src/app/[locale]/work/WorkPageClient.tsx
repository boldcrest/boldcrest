'use client'

import { useLocale, useTranslations } from 'next-intl'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { useTaxonomyLabel, useTaxonomyShortLabel } from '@/lib/taxonomy'
import { Link } from '@/i18n/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import { withSmallMarks } from '@/lib/marks'

interface Project {
  _id: string
  name: string
  slug: { current: string }
  tagline?: string
  client?: string
  industry?: string
  services?: string[]
  thumbnailType?: string
  thumbnail?: {
    asset: { _ref: string }
  }
  thumbnailVideo?: string
  // Resolved server-side from thumbnailVideo (Vimeo cover) for video-cover
  // projects, so the list-view hover preview can show the video's own frame.
  thumbnailPoster?: string
}

interface WorkPageClientProps {
  projects: Project[]
  initialService?: string
  initialIndustry?: string
}

function useInViewOnce(margin = '-50px') {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: margin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [margin])

  return { ref, isVisible }
}

/**
 * Shorter labels for the small mobile card pills ONLY. The card is ~158px wide
 * on a phone, and "Social Media Management" is the one service name that can't
 * fit on a single line there. This is display text, not data — the Sanity value
 * and every filter/query still use the full name, so nothing downstream breaks.
 */
function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tax = useTaxonomyLabel()
  const taxShort = useTaxonomyShortLabel()
  const { ref, isVisible } = useInViewOnce()

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{
        duration: 0.7,
        delay: Math.min(index % 4, 3) * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        href={`/work/${project.slug?.current}`}
        className="group block"
      >
        {/* Card container — fixed aspect, overflow hidden.
            [transform:translate3d(0,0,0)] is load-bearing, not a perf tweak:
            `overflow-hidden` + `border-radius` does NOT reliably clip an
            <iframe>, because the iframe composites on its own layer. On the
            video-thumbnail projects its square corners showed through the
            card's rounded ones as pale arcs. Forcing the card onto its own
            layer makes the rounded clip apply to composited children too.
            Image cards never showed it, which is what pointed at the iframe.
            group-hover:bg-[#0a0a0a] removes the remaining risk: the resting
            --bg-card is #161616, far lighter than the hover panel's #0a0a0a,
            so ANY sub-pixel sliver the rounded clip leaves at a corner shows up
            as a pale arc. Matching the two colours while hovered means a sliver
            has nothing to reveal. */}
        <div className="relative aspect-[1.28/1] overflow-hidden rounded-xl bg-bg-card [transform:translate3d(0,0,0)] md:rounded-2xl md:group-hover:bg-[#0a0a0a]">
          {/* Image — translates UP on hover (desktop only) */}
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
              src={urlFor(project.thumbnail)
                .width(1100)
                .height(859)
                .url()}
              alt={project.name}
              fill
              loading="lazy"
              className="object-cover md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12"
              // Grid is 2-col up to lg, 3-col on lg+ — match the real slot widths
              // so the browser doesn't fetch a full-width image for a half/third card.
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-bg-card">
              <div className="h-[60px] w-[60px] rounded-full border-2 border-text-tertiary" />
            </div>
          )}

          {/* Info panel — grows up from bottom on hover (desktop only).
              Sits 1px BELOW the card (that pixel added back as padding) so its
              fill always covers the clip edge — the aspect-ratio height is
              fractional, and at fractional device pixels this composited
              scaleY layer otherwise leaves a hairline of the cover showing.
              Height follows its CONTENT, so a project with two services gets a
              shorter panel than one with five. Corners stay SQUARE on purpose:
              the card's own overflow-hidden + radius does the rounding. Giving
              the panel its own rounded-b-2xl looked right but left a crescent
              between its curve and the card's (the panel sits 1px lower), and
              --bg-card (#161616) is much lighter than this #0a0a0a fill, so
              that crescent read as a pale arc at each bottom corner. */}
          <div
            className="absolute -bottom-px left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-4 pb-[calc(1rem+1px)] transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block"
          >
            {project.client && (
              <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                {project.client}
              </span>
            )}
            <h3 className="mt-1.5 font-display text-[1.15rem] font-semibold uppercase leading-[1.15] text-text-primary">
              {withSmallMarks(project.tagline || project.name)}
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {project.industry && (
                <span className="rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                  {tax(project.industry)}
                </span>
              )}
              {project.services?.map((service) => (
                <span
                  key={service}
                  className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
                >
                  {tax(service)}
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
          <h3 className="mt-1 font-display text-[1rem] font-semibold uppercase leading-[1.15] text-text-primary">
            {withSmallMarks(project.tagline || project.name)}
          </h3>
          {/* Industry (client category) on its own row, services on the next */}
          <div className="mt-2.5 flex flex-col gap-1.5">
            {project.industry && (
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-[10px] bg-white/10 px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.06em] text-text-secondary">
                  {tax(project.industry)}
                </span>
              </div>
            )}
            {project.services && project.services.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {project.services.map((service) => (
                  <span
                    key={service}
                    // rounded-[10px], NOT the pill radius. A single-line pill is
                    // 20px tall, so 10px IS its stadium — these look unchanged.
                    // But the card is only ~158px wide on a phone and the longest
                    // service ("Social Media Management", 158px) wraps to two
                    // lines; at the pill radius that became a 34px-tall box with
                    // 17px end-caps sitting beside 20px siblings. Capping the
                    // radius makes the wrapped one a tidy rounded rect with the
                    // same corner curvature as the rest.
                    className="rounded-[10px] border border-border px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-[0.06em] text-text-tertiary"
                  >
                    {taxShort(service)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function ProjectListRow({ project, index }: { project: Project; index: number }) {
  const tax = useTaxonomyLabel()
  const { ref, isVisible } = useInViewOnce()
  const [hovered, setHovered] = useState(false)
  const [mouseMoving, setMouseMoving] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const rowRef = useRef<HTMLAnchorElement>(null)
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleScroll = () => {
      setMouseMoving(false)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
      scrollTimer.current = setTimeout(() => setMouseMoving(true), 150)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimer.current) clearTimeout(scrollTimer.current)
    }
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    setMouseMoving(true)
    setMousePos({
      x: e.clientX,
      y: e.clientY,
    })
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.5,
        delay: Math.min(index, 8) * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <Link
        ref={rowRef}
        href={`/work/${project.slug?.current}`}
        className="group relative flex items-center justify-between border-b border-border py-5 transition-colors duration-200 hover:border-text-tertiary"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onMouseMove={handleMouseMove}
      >
        <div className="flex items-baseline gap-3">
          <h3 className="font-display text-[clamp(1.1rem,2vw,1.5rem)] font-bold text-text-primary transition-colors duration-200 group-hover:text-white">
            {withSmallMarks(project.client || project.name)}
          </h3>
          {(project.tagline || (project.client && project.name)) && (
            <span className="font-display text-[clamp(1.1rem,2vw,1.5rem)] font-normal text-text-primary">
              {withSmallMarks(project.tagline || project.name)}
            </span>
          )}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {project.services?.slice(0, 2).map((service) => (
            <span
              key={service}
              className="text-[0.7rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
            >
              {tax(service)}
            </span>
          ))}
        </div>

        {/* Hover thumbnail */}
        <AnimatePresence>
          {hovered && mouseMoving && (project.thumbnailPoster || project.thumbnail?.asset) && (
            <motion.div
              className="pointer-events-none fixed z-30"
              style={{
                left: mousePos.x + 20,
                top: mousePos.y - 80,
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative h-[188px] w-[240px] overflow-hidden rounded-lg shadow-2xl">
                {project.thumbnailType === 'video' && project.thumbnailPoster ? (
                  // Video-cover project: show the Vimeo cover frame (matches the
                  // animated card), not the separate still thumbnail. Plain <img>
                  // since it's an external Vimeo CDN URL, not a Sanity asset.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={project.thumbnailPoster}
                    alt={project.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : project.thumbnail?.asset ? (
                  <Image
                    loader={sanityImageLoader}
                    src={urlFor(project.thumbnail).width(480).height(375).url()}
                    alt={project.name}
                    fill
                    className="object-cover"
                    sizes="240px"
                  />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </motion.div>
  )
}

function InlineFilter({
  openFilter,
  setOpenFilter,
  serviceFilter,
  setServiceFilter,
  industryFilter,
  setIndustryFilter,
  allServices,
  allIndustries,
}: {
  openFilter: 'services' | 'industry' | null
  setOpenFilter: (v: 'services' | 'industry' | null) => void
  serviceFilter: string
  setServiceFilter: (v: string) => void
  industryFilter: string
  setIndustryFilter: (v: string) => void
  allServices: string[]
  allIndustries: string[]
}) {
  const tax = useTaxonomyLabel()
  const t = useTranslations('Work')
  const tp = useTranslations('Portfolio')
  const labelClass =
    'text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-secondary cursor-pointer transition-colors duration-200 hover:text-[#a3a3a3]'
  const itemClass =
    'text-[0.75rem] font-medium uppercase leading-[1.4] tracking-[0.1em] cursor-pointer transition-colors duration-200 hover:text-white whitespace-nowrap'

  const items = openFilter === 'services'
    ? allServices.filter((s) => s !== 'All')
    : allIndustries.filter((s) => s !== 'All')

  const handleSelect = (value: string) => {
    if (openFilter === 'services') {
      setServiceFilter(value === serviceFilter ? 'All' : value)
    } else {
      setIndustryFilter(value === industryFilter ? 'All' : value)
    }
    setOpenFilter(null)
  }

  // When the two filter groups don't fit one line the row wraps and the "|"
  // separator is removed entirely (it would otherwise sit orphaned at the end
  // of the first row). Detection is width-based — would group1 + "|" + group2
  // fit? — so it's independent of whether the divider is currently rendered and
  // can't oscillate when the divider is added/removed.
  const group1Ref = useRef<HTMLSpanElement>(null)
  const group2Ref = useRef<HTMLSpanElement>(null)
  const [stacked, setStacked] = useState(false)
  // Measure with a ResizeObserver wired up through a callback ref on the
  // collapsed row — NOT a plain effect keyed on the filter values. Selecting a
  // filter collapses the panel via AnimatePresence mode="wait", so the collapsed
  // groups only mount AFTER the expanded panel's exit animation finishes. An
  // effect keyed on the values runs immediately on selection, before those
  // groups exist, then never re-runs (no further state change) — leaving a stale
  // measurement and an orphaned divider. ResizeObserver.observe fires as soon as
  // the row and its group spans actually lay out, and again on any width change
  // (viewport resize, clearing a value), so the divider is dropped the moment
  // the two groups wrap.
  const roRef = useRef<ResizeObserver | null>(null)
  const collapsedRef = useCallback((node: HTMLDivElement | null) => {
    roRef.current?.disconnect()
    roRef.current = null
    if (!node) return
    // The collapsed row itself is shrink-to-fit, so its own width tracks its
    // current content — when the divider is hidden the row is ~21px narrower and
    // `needed` would always exceed it, trapping the divider hidden forever once
    // it dropped (even after the viewport widened). Measure against the AVAILABLE
    // width instead: the flex-1 parent (full row width), whose size is fixed by
    // layout and independent of whether the divider is shown.
    const avail = () => node.parentElement?.clientWidth ?? node.clientWidth
    const check = () => {
      const a = group1Ref.current
      const b = group2Ref.current
      if (!a || !b) return
      // gap-x-5 = 20px between items; divider is ~1px (+ its two gaps).
      const needed = a.offsetWidth + b.offsetWidth + 1 + 20 * 2
      setStacked(needed > avail() + 1)
    }
    const ro = new ResizeObserver(check)
    if (node.parentElement) ro.observe(node.parentElement)
    ro.observe(node)
    if (group1Ref.current) ro.observe(group1Ref.current)
    if (group2Ref.current) ro.observe(group2Ref.current)
    roRef.current = ro
  }, [])

  return (
    <motion.div
      className="flex min-w-0 flex-1 select-none items-start gap-5 md:pr-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <AnimatePresence mode="wait">
        {openFilter === null ? (
          /* ── Collapsed: show both labels ── */
          <motion.div
            key="collapsed"
            ref={collapsedRef}
            className="flex flex-wrap items-center gap-x-5 gap-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <span ref={group1Ref} className="flex items-center gap-3">
              <button
                onClick={() => setOpenFilter('services')}
                className={`${labelClass} flex items-center gap-2`}
              >
                {t('filterServices')}
                {serviceFilter !== 'All' && (
                  <span className="text-[#a3a3a3]">{serviceFilter}</span>
                )}
              </button>
              {serviceFilter !== 'All' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setServiceFilter('All') }}
                  aria-label={tp('clearFilter')}
                  className="-ml-1 inline-flex items-center justify-center text-[#a3a3a3] transition-colors duration-200 hover:text-white"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </span>
            {/* Show the "|" only while the two groups share one row; drop it the
                moment they wrap to two rows (so it never orphans at the end of
                row one). Applies at EVERY width incl. mobile — `stacked` is the
                width-based, ResizeObserver-driven wrap detector. */}
            {!stacked && <span className="h-3 w-px bg-text-tertiary" />}
            <span ref={group2Ref} className="flex items-center gap-3">
              <button
                onClick={() => setOpenFilter('industry')}
                className={`${labelClass} flex items-center gap-2`}
              >
                {t('filterIndustry')}
                {industryFilter !== 'All' && (
                  <span className="text-[#a3a3a3]">{industryFilter}</span>
                )}
              </button>
              {industryFilter !== 'All' && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIndustryFilter('All') }}
                  aria-label={tp('clearFilter')}
                  className="-ml-1 inline-flex items-center justify-center text-[#a3a3a3] transition-colors duration-200 hover:text-white"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              )}
            </span>
          </motion.div>
        ) : (
          /* ── Expanded: label + items + X ── */
          <motion.div
            key={`expanded-${openFilter}`}
            className="flex w-full items-start gap-3 sm:gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="shrink-0 text-[0.75rem] font-semibold uppercase tracking-[0.15em] leading-[1.4] text-white whitespace-nowrap">
              {openFilter === 'services' ? t('filterServices') : t('filterIndustry')}
            </span>
            {/* mt-[0.125rem] vertically centers the 12px divider on the first
                row's text (glyph center ≈ 8px from the row top) — matching the
                items-center alignment of the collapsed-state divider. The parent
                stays items-start so the label + divider pin to the first row when
                items wrap to multiple rows. */}
            <span className="mt-[0.125rem] hidden h-3 w-px shrink-0 bg-text-tertiary sm:block" />
            {/* Items size to their content so the X hugs the last filter on a
                single row. When they don't fit, flex-shrink lets them fill the
                available width and wrap to multiple rows — and the X is carried
                to the right edge, preserving the wrapped-state behavior. */}
            <div className="flex min-w-0 flex-shrink flex-wrap items-center gap-x-3 gap-y-2">
              {items.map((item, i) => (
                <motion.button
                  key={item}
                  onClick={() => handleSelect(item)}
                  className={itemClass}
                  style={{ color: '#a3a3a3' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3' }}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: i * 0.04,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  {tax(item)}
                </motion.button>
              ))}
            </div>
            {/* Close X — pinned top-right, aligned with the Services/Industry
                label and the right edge, kept clear of the view-style toggle. */}
            <motion.button
              onClick={() => setOpenFilter(null)}
              aria-label={tp('clearFilter')}
              className="mt-[0.15rem] inline-flex shrink-0 items-center justify-center transition-colors duration-200 focus:outline-none"
              style={{ color: '#a3a3a3' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#a3a3a3' }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.3,
                delay: items.length * 0.04,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1.5 1.5l9 9M10.5 1.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function WorkPageClient({ projects, initialService, initialIndustry }: WorkPageClientProps) {
  const t = useTranslations('Work')
  const tp = useTranslations('Portfolio')
  // The h1 is a stacked word-per-line lockup with the final dot in accent:
  // every word gets its own hard <br/>, so the split below decides the shape.
  // Splitting the translated title keeps it in every language rather than
  // hard-coding three English words.
  //
  // Languages that need an article where English does not would otherwise put
  // it alone on a line ("L'audacia / costruisce / i / brand."), and Albanian
  // stranded a one-letter particle across five lines. The translations join
  // those to the word they belong with using a NON-BREAKING space, which this
  // split leaves intact — keep that convention when editing Work.title.
  const titleWords = t('title').replace(/[.]$/, '').split(' ')
  const [serviceFilter, setServiceFilter] = useState(initialService || 'All')
  const [industryFilter, setIndustryFilter] = useState(initialIndustry || 'All')
  const [openFilter, setOpenFilter] = useState<'services' | 'industry' | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mirror the active filters into the URL with router.replace (so Next owns the
  // history entry and the browser Back button from a project restores them — a
  // native replaceState is dropped on back because Next restores its own cached
  // state). replace (not push) keeps the back button going to the project list
  // once, not through every filter tweak; a fresh /work visit has no query, so
  // filters start clean and never get permanently stuck.
  //
  // The target MUST carry the active locale. Hard-coding `/work` meant that on
  // /fr/work this effect fired on mount and replaced the URL with the English
  // one — switching language on this page appeared to do nothing, because the
  // switch landed and was then immediately undone.
  const router = useRouter()
  const locale = useLocale()
  useEffect(() => {
    const params = new URLSearchParams()
    if (serviceFilter !== 'All') params.set('service', serviceFilter)
    if (industryFilter !== 'All') params.set('industry', industryFilter)
    const qs = params.toString()
    const base = locale === routing.defaultLocale ? '/work' : `/${locale}/work`
    const target = qs ? `${base}?${qs}` : base
    if (window.location.pathname + window.location.search !== target) {
      router.replace(target, { scroll: false })
    }
  }, [serviceFilter, industryFilter, router, locale])

  const allServices = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => p.services?.forEach((s) => set.add(s)))
    return ['All', ...Array.from(set)]
  }, [projects])

  const allIndustries = useMemo(() => {
    const set = new Set<string>()
    projects.forEach((p) => {
      if (p.industry) set.add(p.industry)
    })
    return ['All', ...Array.from(set)]
  }, [projects])

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchService =
        serviceFilter === 'All' || p.services?.includes(serviceFilter)
      const matchIndustry =
        industryFilter === 'All' || p.industry === industryFilter
      return matchService && matchIndustry
    })
  }, [projects, serviceFilter, industryFilter])

  return (
    <main className="relative">
      {/* ── Hero ── */}
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-0 landscape-short:pt-[5.5rem]">
        <div>
          <motion.p
            className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {t('eyebrow')}
          </motion.p>

          {/* Title row — h1 left, description right-aligned to bottom of h1 */}
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <motion.h1
              className="font-display text-[clamp(2.5rem,6vw,5.5rem)] font-bold leading-[1] tracking-[-0.03em] text-white landscape-short:text-[2.25rem]"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {titleWords.map((w, i) => (
                <span key={i}>
                  {w}
                  {i < titleWords.length - 1 && <br />}
                </span>
              ))}
              <span className="text-accent">.</span>
            </motion.h1>

            <motion.p
              className="max-w-[400px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {t('intro')}
            </motion.p>
          </div>

        </div>

        {/* Divider + Filters + View Toggle — divider sits directly below the hero, above the filters */}
        <div className="mt-10 md:mt-12 lg:mt-16">
          {/* Divider — directly below hero, above filters */}
          <div className="h-px w-full bg-border" />

          <div className="mt-6 flex items-start justify-between gap-4">
            <InlineFilter
              openFilter={openFilter}
              setOpenFilter={setOpenFilter}
              serviceFilter={serviceFilter}
              setServiceFilter={setServiceFilter}
              industryFilter={industryFilter}
              setIndustryFilter={setIndustryFilter}
              allServices={allServices}
              allIndustries={allIndustries}
            />

            {/* Grid / List toggle */}
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => setViewMode('grid')}
                className={`transition-colors duration-200 ${viewMode === 'grid' ? 'text-white' : 'text-text-tertiary hover:text-white'}`}
                aria-label={tp('gridView')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="0.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="10.5" y="0.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="0.5" y="10.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                  <rect x="10.5" y="10.5" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`transition-colors duration-200 ${viewMode === 'list' ? 'text-white' : 'text-text-tertiary hover:text-white'}`}
                aria-label={tp('listView')}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <line x1="0" y1="2" x2="18" y2="2" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="12" x2="18" y2="12" stroke="currentColor" strokeWidth="1.2" />
                  <line x1="0" y1="17" x2="18" y2="17" stroke="currentColor" strokeWidth="1.2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section className={`px-[var(--gutter)] pb-[var(--space-3xl)] ${viewMode === 'grid' ? 'pt-[var(--space-md)] md:pt-[var(--space-xl)]' : 'pt-0'}`}>
        <AnimatePresence mode="wait">
          {viewMode === 'grid' ? (
            <motion.div
              key="grid"
              className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-2 md:gap-x-6 md:gap-y-14 lg:grid-cols-3 lg:gap-x-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filtered.map((project, i) => (
                <ProjectCard key={project._id} project={project} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {filtered.map((project, i) => (
                <ProjectListRow key={project._id} project={project} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-20 text-center text-text-tertiary">
            {t('empty')}
          </div>
        )}
      </section>
    </main>
  )
}
