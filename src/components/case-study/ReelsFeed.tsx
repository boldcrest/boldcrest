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
  resumeFrom,
  onClose,
}: {
  reels: Reel[]
  startAt: number
  /** how far the rail card had played the reel this opened on */
  resumeFrom?: number
  onClose: () => void
}) {
  const t = useTranslations('CaseStudy')
  const scroller = useRef<HTMLDivElement>(null)
  const slides = useRef<(HTMLDivElement | null)[]>([])
  const [current, setCurrent] = useState(startAt)
  // The reel this opened on decides what plays, not the observer. The slides
  // are still being scrolled into place when the feed appears, and the observer
  // fires for whichever one it passes on the way — which would leave the feed
  // showing one reel and playing another. It is ignored until that has settled.
  const settling = useRef(true)
  useEffect(() => {
    settling.current = true
    setCurrent(startAt)
    const id = window.setTimeout(() => {
      settling.current = false
    }, 400)
    return () => window.clearTimeout(id)
  }, [startAt])

  // Escape closes, and the page underneath does not scroll while this is up.
  //
  // Lenis is what actually matters here: it hijacks wheel for smooth page
  // scroll, so overflow:hidden alone did nothing and the wheel went to the page
  // behind. But it must NOT be stopped either — a STOPPED Lenis still
  // preventDefaults wheel (the same trap the People deck documents), which
  // swallows the event before `data-lenis-prevent` on the scroller can let the
  // feed have it: measured, the feed could not scroll at all while it was
  // stopped, and scrolled the moment it was started again.
  //
  // So Lenis keeps running and is told to ignore this subtree, and the page
  // behind is pinned with overflow + overscroll-behavior on BODY (not <html>,
  // and deliberately not the position:fixed-body trick, which suppresses iOS
  // Safari's visualViewport keyboard resize).
  useEffect(() => {
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevOverscroll = body.style.overscrollBehavior
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      body.style.overflow = prevOverflow
      body.style.overscrollBehavior = prevOverscroll
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
            if (i >= 0 && !settling.current) setCurrent(i)
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


      {/* one reel per screen; snapping so a flick lands on a whole one */}
      <div
        ref={scroller}
        // Lenis ignores wheel/touch that starts inside a [data-lenis-prevent],
        // which is how the chat body scrolls inside the start-a-project panel.
        // Without it this scroller gets nothing and the page moves instead.
        data-lenis-prevent
        data-current={current}
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reels.map((reel, i) => (
          <div
            key={i}
            ref={(el) => {
              slides.current[i] = el
            }}
            // Clicking the space around the reel closes the feed. Only when
            // the slide ITSELF is the target: a click that bubbles up from the
            // player, its controls or the title must not close it, and this is
            // steadier than stopPropagation on everything inside.
            onClick={(e) => {
              if (e.target === e.currentTarget) onClose()
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
                  // Deliberately nothing. In the feed the slide on screen is
                  // the one that plays, and the scroller decides which that is.
                  // A player announcing itself cannot be trusted for this:
                  // Vimeo emits 'play' whenever it gets round to it, often a
                  // second or more after the reel was asked to start, by which
                  // time the visitor has already scrolled on — and that stale
                  // event dragged `current` back to the reel behind, leaving
                  // the next one sitting at 0:00 under its cover.
                  onPlay={() => {}}
                  onClose={onClose}
                  resumeFrom={i === startAt ? resumeFrom : undefined}
                  // the one either side is built ahead of time, so scrolling
                  // onto it starts the video rather than the cover
                  preload={Math.abs(i - current) <= 1}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
