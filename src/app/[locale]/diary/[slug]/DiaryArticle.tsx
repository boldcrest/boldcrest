'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import { useLenis } from '@/components/LenisProvider'
import Footer from '@/components/Footer'

interface DiaryPost {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  category?: string
  coverImage?: { asset: { _ref: string } }
  body?: any[]
  publishedAt?: string
}

const TRANSITION_DURATION = 600

const LOREM_PARAGRAPHS = [
  `Every brand carries weight, the weight of intention, the weight of perception, the weight of every decision that brought it here. What separates the ones that endure from the ones that fade is simple: clarity of purpose.`,
  `We have seen it across industries and across borders. The brands that move people are not louder, they are sharper. They understand that design is not decoration. It is a language.`,
  `At BoldCrest, we approach every project as if reputation is on the line, because it is. Ours and yours.`,
]

/* Portable Text — inline images supported between text */
const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: any }) => {
      if (!value?.asset) return null
      return (
        <figure className="my-12">
          <div className="overflow-hidden rounded-xl">
            <Image
              loader={sanityImageLoader}
              src={urlFor(value).width(1600).url()}
              alt={value.alt || ''}
              width={1600}
              height={1000}
              className="h-auto w-full"
              sizes="(max-width: 768px) 100vw, 760px"
            />
          </div>
          {value.caption && (
            <figcaption className="mt-3 text-[0.8rem] uppercase tracking-[0.1em] text-text-tertiary">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  block: {
    normal: ({ children }) => (
      <p className="mb-6 text-[1.15rem] leading-[1.75] text-text-primary/85">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="mb-4 mt-12 font-display text-[clamp(1.5rem,3vw,2.2rem)] font-bold leading-[1.2] tracking-[-0.02em]">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-3 mt-8 font-display text-[1.3rem] font-semibold leading-[1.3]">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="my-10 border-l-[3px] border-accent pl-6 text-[1.25rem] font-medium italic leading-[1.6] text-text-primary/70">{children}</blockquote>
    ),
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 transition-colors duration-200 hover:text-accent">
        {children}
      </a>
    ),
  },
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function DiaryArticle({ post, morePosts = [] }: { post: DiaryPost; morePosts?: DiaryPost[] }) {
  const [current, setCurrent] = useState(0) // 0 = cover, 1 = article
  const [isLocked, setIsLocked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLDivElement>(null) // scrollable second slide
  const touchStartY = useRef(0)
  // Cover-slide wheel state (refs so they survive handler re-creation):
  // accumulated intent within one continuous gesture, the last wheel timestamp
  // (drives the accumulation reset + the momentum gap test), a momentum "swallow"
  // flag set on a snap, the snap timestamp, and the magnitude of the last
  // swallowed event. The swallow absorbs the trailing inertia (pinning the
  // article to the top so it can't drift) and releases when EITHER the stream
  // pauses (a real gesture boundary) OR — once past the inertia ramp — a clearly
  // larger push arrives (a deliberate new flick punching through dying inertia).
  // Timestamps only: no timer to orphan, can't get stuck.
  const wheelAccum = useRef(0)
  const lastWheelTs = useRef(0)
  const swallowActive = useRef(false)
  const swallowStart = useRef(0)
  const lastMomMag = useRef(0)
  const lenis = useLenis()

  const hasBody = post.body && post.body.length > 0
  const hasCover = !!post.coverImage?.asset

  const goTo = useCallback(
    (index: number) => {
      if (isLocked) return
      const clamped = Math.max(0, Math.min(1, index))
      if (clamped === current) return
      setIsLocked(true)
      setCurrent(clamped)
      setTimeout(() => setIsLocked(false), TRANSITION_DURATION + 40)
    },
    [current, isLocked]
  )

  // Reset the article scroll to top whenever the cover is showing
  useEffect(() => {
    if (current === 0 && articleRef.current) articleRef.current.scrollTop = 0
  }, [current])

  // Drive the (window-scroll-based) Header collapse from the active slide,
  // since body scroll is locked here. Cover = expanded, article = collapsed.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('bc-scroll', { detail: { scrollY: current === 1 ? 200 : 0 } }))
  }, [current])
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent('bc-scroll', { detail: { scrollY: 0 } }))
    }
  }, [])

  // Wheel: cover snaps to article; on article, only snap back when scrolled to its top
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e: WheelEvent) => {
      // Normalise across delta modes (px / line / page) so one mouse-wheel
      // notch and a trackpad swipe are comparable.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      const dy = e.deltaY * unit
      const absdy = Math.abs(dy)
      const gap = e.timeStamp - lastWheelTs.current
      lastWheelTs.current = e.timeStamp

      // Momentum swallow: after a snap, absorb the trailing trackpad inertia so a
      // hard flick can't overshoot into the article. Inertia is a continuous
      // stream (~60fps) — eat it (and pin the article to the top) while it flows.
      // Release when EITHER:
      //  • the stream pauses (>150ms gap) — the user lifted off, real new gesture; or
      //  • past the inertia ramp window (>180ms after the snap) a clearly larger
      //    push arrives — a deliberate NEW flick to scroll the body right away.
      // Why 1.5× is safe: once past the ramp gate, real inertia only ever DECAYS
      // (each event ≤ the previous), so it can never satisfy `> last × 1.5`; only
      // an abrupt re-flick can. The gate skips the brief ramp-up where inertia
      // momentarily grows. So this lets you re-scroll immediately without ever
      // mis-releasing mid-glide (which would drift the body deeper).
      if (swallowActive.current) {
        const sinceSnap = e.timeStamp - swallowStart.current
        if (gap > 150) {
          swallowActive.current = false
        } else if (sinceSnap > 180 && absdy > lastMomMag.current * 1.5 + 12) {
          swallowActive.current = false
        } else {
          e.preventDefault()
          lastMomMag.current = absdy
          if (current === 1 && articleRef.current) articleRef.current.scrollTop = 0
          return
        }
      }

      // NOTE: no blanket `isLocked` wheel-block here. The swallow above already
      // absorbs the post-snap inertia, and goTo() keeps its own isLocked guard —
      // so we don't need to freeze the body's native scroll for the whole 0.6s
      // transition (that froze re-scrolling far longer than necessary).

      if (current === 0) {
        e.preventDefault()
        // Only a downward gesture advances. Accumulate intent WITHIN one
        // continuous gesture (reset if the events stop or reverse), so even a
        // gentle first swipe — whose individual deltas are tiny — reliably
        // crosses the threshold instead of being ignored (the old "needs a
        // second scroll" feel).
        if (dy <= 0 || gap > 200) wheelAccum.current = 0
        if (dy > 0) {
          wheelAccum.current += dy
          if (wheelAccum.current >= 28) {
            wheelAccum.current = 0
            swallowActive.current = true
            swallowStart.current = e.timeStamp
            lastMomMag.current = absdy
            goTo(1)
          }
        }
        return
      }

      // current === 1 — article scrolls natively; snap back only at its very top
      if (absdy < 12) return
      const art = articleRef.current
      if (dy < 0 && art && art.scrollTop <= 0) {
        e.preventDefault()
        swallowActive.current = true
        swallowStart.current = e.timeStamp
        lastMomMag.current = absdy
        goTo(0)
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [current, isLocked, goTo])

  // Touch
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY }
    const onEnd = (e: TouchEvent) => {
      if (isLocked) return
      const diff = touchStartY.current - e.changedTouches[0].clientY
      if (Math.abs(diff) < 50) return
      if (current === 0) {
        if (diff > 0) goTo(1)
      } else {
        const art = articleRef.current
        if (diff < 0 && art && art.scrollTop <= 0) goTo(0)
      }
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchend', onEnd)
    }
  }, [current, isLocked, goTo])

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); goTo(1) }
      if (e.key === 'ArrowUp') {
        const art = articleRef.current
        if (current === 1 && art && art.scrollTop > 0) return
        e.preventDefault(); goTo(0)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, goTo])

  // Lock the page scroll while the deck is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // The embedded footer's "back to top" scrolls the article slide to its top
  // (body scroll is locked, so the footer's window.scrollTo is a no-op here).
  useEffect(() => {
    const handler = () => articleRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.addEventListener('boldcrest:back-to-top', handler)
    return () => window.removeEventListener('boldcrest:back-to-top', handler)
  }, [])

  // Pause Lenis so the article slide scrolls natively (fires once the
  // Lenis instance is available via context — survives full page loads).
  useEffect(() => {
    if (!lenis) return
    lenis.stop()
    return () => lenis.start()
  }, [lenis])

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden bg-bg" style={{ zIndex: 10 }}>
      <motion.div
        className="relative will-change-transform"
        animate={{ y: `${-current * 100}dvh` }}
        transition={{ duration: TRANSITION_DURATION / 1000, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* ── Slide 0 — cover: title + featured image, full screen ── */}
        <section className="flex h-[100dvh] flex-col overflow-hidden bg-bg">
          <div className="px-[var(--gutter)] pt-[110px] pb-[var(--space-lg)]">
            <div className="w-full">
              <motion.nav
                className="mb-[var(--space-md)] flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.15em] text-text-tertiary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link href="/diary" className="transition-colors duration-200 hover:text-white">
                  Diary
                </Link>
                {post.category && (
                  <>
                    <span>/</span>
                    <Link
                      href={`/diary?category=${encodeURIComponent(post.category)}`}
                      className="text-text-secondary transition-colors duration-200 hover:text-white"
                    >
                      {post.category}
                    </Link>
                  </>
                )}
              </motion.nav>

              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <motion.h1
                  className="max-w-[20ch] font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.12] tracking-[-0.03em]"
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                >
                  {post.title}
                </motion.h1>

                <motion.div
                  className="md:max-w-[420px] md:text-right"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {post.excerpt && (
                    <p className="text-[1rem] leading-[1.75] text-text-secondary">{post.excerpt}</p>
                  )}
                  {post.publishedAt && (
                    <p className="mt-[var(--space-sm)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                      {formatDate(post.publishedAt)}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Featured image fills the rest of the screen */}
          <div className="relative w-full flex-1 overflow-hidden">
            {hasCover && (
              <Image
                loader={sanityImageLoader}
                src={urlFor(post.coverImage!).width(2400).url()}
                alt={post.title}
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            )}
          </div>

          {/* Scroll cue */}
          <motion.div
            className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2"
            animate={{ opacity: current === 0 ? 0.5 : 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="h-10 w-px bg-white"
              animate={{ scaleY: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top' }}
            />
          </motion.div>
        </section>

        {/* ── Slide 1 — article: all text + images, internally scrollable ── */}
        <section
          ref={articleRef}
          data-lenis-prevent
          className="h-[100dvh] overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="px-[var(--gutter)] pt-[120px] pb-[var(--space-2xl)]">
            <div className="mx-auto grid max-w-[var(--max-width)] grid-cols-1 lg:grid-cols-12 lg:gap-5">
              <div className="lg:col-start-3 lg:col-span-8">
                {hasBody ? (
                  <PortableText value={post.body!} components={ptComponents} />
                ) : (
                  LOREM_PARAGRAPHS.map((text, i) => (
                    <p key={i} className="mb-6 text-[1.15rem] leading-[1.75] text-text-primary/85">
                      {text}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* MORE DIARY — same container/line/grid/spacing as the portfolio
              "More Work" suggestions (RelatedProjects) for visual parity. */}
          {morePosts.length > 0 && (
            <section className="border-t border-border px-[var(--gutter)] py-[var(--space-2xl)]">
              <div className="w-full">
                <h2 className="mb-[var(--space-lg)] text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  More Diary
                </h2>

                <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-5">
                  {morePosts.map((p, index) => (
                    <Link
                      key={p._id}
                      href={`/diary/${p.slug.current}`}
                      className={`group ${index === 4 ? 'hidden md:block' : 'block'}`}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-bg-card">
                        {p.coverImage?.asset ? (
                          <Image
                            loader={sanityImageLoader}
                            src={urlFor(p.coverImage).width(800).height(600).quality(80).url()}
                            alt={p.title}
                            fill
                            sizes="(max-width: 768px) 50vw, 23vw"
                            className="object-cover transition-transform duration-[0.5s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-bg-card">
                            <span className="font-display text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-text-tertiary">
                              {p.title}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Caption */}
                      {p.category && (
                        <span className="mt-3 block text-[0.7rem] font-semibold uppercase tracking-[0.15em] text-text-tertiary">
                          {p.category}
                        </span>
                      )}
                      <h3 className="mt-1 font-display text-[0.95rem] font-semibold uppercase leading-[1.2] text-text-primary transition-colors duration-300 group-hover:text-accent">
                        {p.title}
                      </h3>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Footer flows in at the end of the article (the fixed-overlay deck
              hides the global one, so we render it here). */}
          <Footer forceShow />
        </section>
      </motion.div>
    </div>
  )
}
