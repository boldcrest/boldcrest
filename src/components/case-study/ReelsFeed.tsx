'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import ReelPlayer from './ReelPlayer'
import type { Reel } from './ReelsCarousel'

/**
 * The reels full screen, as a feed: one reel per screen, scrolled vertically
 * with snapping, the way Instagram and TikTok do it. The slide in view is the
 * one playing; scrolling to the next starts it and stops the one behind.
 *
 * It sits over the floating menu (z-1800, above the header's 1002) and under
 * the start-a-project panel (1900), on the same dim-and-blur the rest of the
 * site puts over the page.
 */
export default function ReelsFeed({
  reels,
  startAt,
  onClose,
}: {
  reels: Reel[]
  startAt: number
  onClose: () => void
}) {
  const t = useTranslations('CaseStudy')
  const scroller = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [current, setCurrent] = useState(startAt)

  // Escape closes, and the page underneath does not scroll while this is up.
  useEffect(() => {
    const html = document.documentElement
    const saved = html.style.overflow
    html.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = saved
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Open on the reel that was tapped, without animating through the ones above
  // it — `instant`, before the observer below is wired.
  useEffect(() => {
    const el = slides.current[startAt]
    el?.scrollIntoView({ block: 'start', behavior: 'instant' as ScrollBehavior })
  }, [startAt])

  // Whichever slide is mostly on screen is the one playing. A threshold rather
  // than a scroll handler, so a flick that overshoots and snaps back does not
  // start two reels on the way.
  useEffect(() => {
    const root = scroller.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = slides.current.indexOf(e.target as HTMLDivElement)
            if (i >= 0) setCurrent(i)
          }
        }
      },
      { root, threshold: [0.6] },
    )
    for (const el of slides.current) if (el) io.observe(el)
    return () => io.disconnect()
  }, [reels.length])

  return (
    <div className="fixed inset-0 z-[1800]" role="dialog" aria-modal="true">
      {/* the same dim and blur start-a-project puts over the site */}
      <div
        aria-hidden
        className="absolute inset-0 bg-black/40 [@media(min-width:700px)_and_(min-height:700px)]:backdrop-blur-[6px] [@media(pointer:fine)]:backdrop-blur-[6px]"
        onClick={onClose}
      />

      <button
        type="button"
        onClick={onClose}
        aria-label={t('exitFullscreen')}
        className="absolute right-[var(--gutter)] top-6 z-20 flex size-12 items-center justify-center text-white/80 transition-all duration-300 hover:text-white hover:[border-color:rgba(255,255,255,0.6)]"
        style={{
          borderRadius: 'var(--radius-pill)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255,255,255,0.45)',
          backgroundColor: 'rgba(10,10,10,0.72)',
          backdropFilter: 'blur(24px) saturate(1.5)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      </button>

      {/* one reel per screen; snapping so a flick lands on a whole one */}
      <div
        ref={scroller}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => (
          <div
            key={i}
            ref={(el) => {
              slides.current[i] = el
            }}
            className="flex h-full snap-start snap-always items-center justify-center px-[var(--gutter)] py-6"
          >
            <div className="h-full max-h-[min(100%,960px)] w-auto max-w-full">
              {/* the 9:16 frame, as tall as the screen allows */}
              <div className="mx-auto h-full" style={{ aspectRatio: '9 / 16' }}>
                <ReelPlayer
                  vimeoUrl={reel.vimeoUrl as string}
                  poster={reel.poster}
                  caption={reel.caption}
                  active={current === i}
                  autoPlay
                  inFeed
                  onPlay={() => setCurrent(i)}
                />
              </div>
              {reel.caption && (
                <p className="mt-3 text-center text-[0.8rem] leading-[1.5] text-white/70">
                  {reel.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
