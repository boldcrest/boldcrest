'use client'

import { useTaxonomyLabel } from '@/lib/taxonomy'
import { useCallback, useEffect, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { Link } from '@/i18n/navigation'
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
  thumbnail?: { asset: { _ref: string } }
  thumbnailType?: string
  thumbnailVideo?: string
}

interface ProjectMarqueeProps {
  heading?: string
  projects: Project[]
  accentColor?: string
}

export default function ProjectMarquee({
  heading,
  projects,
  accentColor = '#DA291C',
}: ProjectMarqueeProps) {
  const tax = useTaxonomyLabel()
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Auto-scroll + drag-to-scroll on a real scroll container
  const scrollerRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false, captured: false })
  const frac = useRef(0)
  // On touch devices the strip scrolls natively (overflow-x); pause the
  // auto-advance for a beat after any touch so the swipe + its momentum aren't
  // fought by the auto-scroll. Timestamp of the last touch interaction.
  const lastTouch = useRef(0)
  // Auto-scroll speed scales with viewport width so the perceived speed
  // (how fast a card sweeps across the screen) stays consistent — a fixed
  // px/sec feels far too fast on a narrow phone. Clamped so it never crawls.
  const speedRef = useRef(125)

  // Keep scrollLeft inside the 2nd copy's window [oneSet, 2·oneSet). The 4 copies
  // are identical so snapping by ±oneSet is seamless and gives an infinite loop in
  // BOTH directions — native touch scroll clamps at 0 and would otherwise hit a
  // hard wall at the start. Shared by mouse-drag, auto-scroll, and the scroll event.
  const wrap = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    // Exact width of ONE copy, measured as the offset of the 2nd copy's first
    // card. scrollWidth/4 is ~0.25 of a gap short — the 4 copies share 4N-1
    // gaps, not 4N — so snapping by it drifted a few px and showed a jump once
    // per loop. Measuring the real stride keeps the wrap seamless.
    const kids = (el.firstElementChild as HTMLElement | null)?.children
    const n = projects.length
    const oneSet =
      kids && n > 0 && kids.length > n
        ? (kids[n] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
        : el.scrollWidth / 4
    if (oneSet <= 0) return
    if (el.scrollLeft < oneSet) el.scrollLeft += oneSet
    else if (el.scrollLeft >= oneSet * 2) el.scrollLeft -= oneSet
  }, [projects.length])

  useEffect(() => {
    const calcSpeed = () => {
      const vw = window.innerWidth
      speedRef.current = Math.max(55, Math.min(125, (125 * vw) / 1440))
    }
    calcSpeed()
    window.addEventListener('resize', calcSpeed)
    return () => window.removeEventListener('resize', calcSpeed)
  }, [])

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    let raf = 0
    let last = 0
    // Start one set in so there's a full copy to the LEFT to scroll back into.
    const recenter = () => {
      const kids = (el.firstElementChild as HTMLElement | null)?.children
      const n = projects.length
      const oneSet =
        kids && n > 0 && kids.length > n
          ? (kids[n] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
          : el.scrollWidth / 4
      if (oneSet > 0 && el.scrollLeft < 1) el.scrollLeft = oneSet
    }
    recenter()
    const t = setTimeout(recenter, 150) // retry once thumbnails have measured
    el.addEventListener('scroll', wrap, { passive: true })
    const tick = (now: number) => {
      if (!last) last = now
      const dt = (now - last) / 1000
      last = now
      if (!drag.current.active && now - lastTouch.current > 1000) {
        // Add only whole-pixel steps — Safari/Firefox round scrollLeft to
        // integers, dropping sub-pixel increments (strip would never move).
        frac.current += speedRef.current * dt
        const stepPx = Math.floor(frac.current)
        if (stepPx > 0) {
          frac.current -= stepPx
          el.scrollLeft += stepPx
          wrap()
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      el.removeEventListener('scroll', wrap)
    }
  }, [wrap, projects.length])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    // Do NOT capture the pointer here. Capturing on a plain click retargets the
    // click to this container and breaks the card links — capture only once a
    // real drag begins (see onPointerMove).
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: false, captured: false }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current
    if (!d.active) return
    const el = scrollerRef.current
    if (!el) return
    const delta = e.clientX - d.startX
    if (Math.abs(delta) > 5 && !d.moved) {
      d.moved = true
      el.setPointerCapture(e.pointerId)
      d.captured = true
    }
    if (!d.moved) return
    el.scrollLeft = d.startScroll - delta
    wrap()
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    if (drag.current.captured) {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId)
      drag.current.captured = false
    }
  }
  // Swallow the click that follows a real drag so cards don't navigate
  const onClickCapture = (e: React.MouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  const items = projects.length > 0 ? projects : []
  const repeated = [...items, ...items, ...items, ...items]

  if (items.length === 0) return null

  return (
    <section ref={ref} className="overflow-hidden py-[var(--space-xl)] md:py-[var(--space-2xl)]">
      {heading && (
        <div className="px-[var(--gutter)]">
          <motion.h2
            className="mb-10 text-center font-display text-[clamp(1.2rem,2.5vw,1.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {heading}
          </motion.h2>
        </div>
      )}

      {/* Scrolling project thumbnails — auto-scroll + drag, sized to match /work grid cards */}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
        onTouchStart={() => { lastTouch.current = performance.now() }}
        onTouchMove={() => { lastTouch.current = performance.now() }}
        onTouchEnd={() => { lastTouch.current = performance.now() }}
        className="relative cursor-grab touch-pan-x touch-pan-y overflow-x-auto overflow-y-hidden select-none [scrollbar-width:none] active:cursor-grabbing [&_a]:select-none [&_img]:pointer-events-none [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex w-max gap-6 md:gap-8">
          {repeated.map((project, i) => {
            const vimeoId =
              project.thumbnailType === 'video' && project.thumbnailVideo
                ? project.thumbnailVideo.match(/vimeo\.com\/(\d+)/)?.[1]
                : null

            return (
            <Link
              key={`${project._id}-${i}`}
              href={`/work/${project.slug.current}`}
              draggable={false}
              className="group shrink-0"
              style={{ width: 'clamp(320px, 32vw, 580px)' }}
            >
              {/* Card container */}
              <div className="relative aspect-[1.28/1] overflow-hidden rounded-2xl bg-bg-card [transform:translate3d(0,0,0)] md:group-hover:bg-[#0a0a0a]">
                {/* Image / Video — translates UP on hover (desktop only) */}
                {vimeoId ? (
                  <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?background=1&autoplay=1&loop=1&muted=1`}
                    className="pointer-events-none absolute top-1/2 left-1/2 h-[200%] w-[200%] -translate-x-1/2 -translate-y-1/2 md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:group-hover:-translate-y-[calc(50%+48px)]"
                    style={{ border: 'none' }}
                    allow="autoplay; fullscreen"
                    loading="lazy"
                  />
                ) : project.thumbnail?.asset?._ref ? (
                  <Image
                    loader={sanityImageLoader}
                    src={urlFor(project.thumbnail).width(1400).height(1094).quality(85).url()}
                    alt={project.name}
                    fill
                    draggable={false}
                    // Cards are width-capped at 580px (clamp), but 32vw kept
                    // over-fetching on wide monitors; pin the wide-screen branch
                    // to 580px so the 4 looping copies don't balloon decoded
                    // memory (the load that tips iOS Safari into blanking tiles).
                    sizes="(max-width: 768px) 80vw, (max-width: 1812px) 32vw, 580px"
                    className="pointer-events-none object-cover md:transition-transform md:duration-[250ms] md:ease-[cubic-bezier(0.4,0,0.2,1)] md:will-change-transform md:group-hover:-translate-y-12"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ backgroundColor: `${accentColor}12` }}
                  >
                    <span className="font-display text-[0.8rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                      {project.name}
                    </span>
                  </div>
                )}

                {/* Info panel — scales up from bottom on hover (desktop only).
                    Sits 1px BELOW the card (that pixel added back as padding) so
                    its fill always covers the clip edge — the aspect-ratio height
                    is fractional, and at fractional device pixels this composited
                    scaleY layer otherwise leaves a hairline of the cover showing. */}
                <div className="absolute -bottom-px left-0 z-20 hidden w-full origin-bottom scale-y-0 bg-[#0a0a0a] px-5 pt-4 pb-[calc(1rem+1px)] transition-transform duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100 md:block">
                  {project.client && (
                    <span className="block text-[0.75rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                      {project.client}
                    </span>
                  )}
                  <h3 className="mt-1.5 font-display text-[1.05rem] font-semibold uppercase leading-[1.15] text-text-primary">
                    {withSmallMarks(project.tagline || project.name)}
                  </h3>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {project.industry && (
                      <span className="rounded-[var(--radius-pill)] bg-white/10 px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                        {tax(project.industry)}
                      </span>
                    )}
                    {project.services?.map((service) => (
                      <span
                        key={service}
                        className="rounded-[var(--radius-pill)] border border-border px-3.5 py-1.5 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
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
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {project.industry && (
                    <span className="rounded-[var(--radius-pill)] bg-white/10 px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-secondary">
                      {tax(project.industry)}
                    </span>
                  )}
                  {project.services?.map((service) => (
                    <span
                      key={service}
                      className="rounded-[var(--radius-pill)] border border-border px-3 py-1 text-[0.6rem] font-medium uppercase tracking-[0.1em] text-text-tertiary"
                    >
                      {tax(service)}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
