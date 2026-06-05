'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import { useLenis } from '@/components/LenisProvider'

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

const TRANSITION_DURATION = 700

const LOREM_PARAGRAPHS = [
  `Every brand carries weight — the weight of intention, the weight of perception, the weight of every decision that brought it here. What separates the ones that endure from the ones that fade is simple: clarity of purpose.`,
  `We have seen it across industries and across borders. The brands that move people are not louder — they are sharper. They understand that design is not decoration. It is a language.`,
  `At BoldCrest, we approach every project as if reputation is on the line — because it is. Ours and yours.`,
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

export default function DiaryArticle({ post }: { post: DiaryPost }) {
  const [current, setCurrent] = useState(0) // 0 = cover, 1 = article
  const [isLocked, setIsLocked] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const articleRef = useRef<HTMLDivElement>(null) // scrollable second slide
  const touchStartY = useRef(0)
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
      setTimeout(() => setIsLocked(false), TRANSITION_DURATION + 100)
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
      if (isLocked) { e.preventDefault(); return }
      if (Math.abs(e.deltaY) < 12) return
      if (current === 0) {
        e.preventDefault()
        if (e.deltaY > 0) goTo(1)
      } else {
        const art = articleRef.current
        if (e.deltaY < 0 && art && art.scrollTop <= 0) {
          e.preventDefault()
          goTo(0)
        }
        // otherwise let the article scroll natively
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
        transition={{ duration: TRANSITION_DURATION / 1000, ease: [0.76, 0, 0.24, 1] }}
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
                    <span className="text-text-secondary">{post.category}</span>
                  </>
                )}
              </motion.nav>

              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                <motion.h1
                  className="max-w-[20ch] font-display text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]"
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

                {/* Back to Diary */}
                <div className="mt-[var(--space-2xl)] border-t border-border pt-[var(--space-lg)]">
                  <Link
                    href="/diary"
                    className="group inline-flex items-center gap-3 text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-text-tertiary transition-colors duration-300 hover:text-text-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="rotate-180 transition-transform duration-300 group-hover:-translate-x-1">
                      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Back to Diary
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </motion.div>
    </div>
  )
}
