'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import ReelPlayer from './ReelPlayer'
import type { Reel } from './ReelsCarousel'

/** The clear space above and below a reel: half of whatever the screen has
 *  left once the reel has taken its height, which is the screen minus the two
 *  3.25rem bands, or 960px, whichever is less. */
const GAP = 'calc((100% - min(100% - 6.5rem, 960px)) / 2)'

/** Points the way the feed can still go, beside the line that says so. Drawn
 *  on the same stroke as the player's own icons, at the cap height of the
 *  text. */
function Arrow({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={up ? { transform: 'rotate(180deg)' } : undefined}
    >
      <path d="M12 4.5v15M5.5 13l6.5 6.5 6.5-6.5" />
    </svg>
  )
}

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
  // The reels give a little when there is nothing past them, and the line at
  // that end says which one has been reached. Nothing is blocked: this is the
  // feed answering a gesture it cannot act on.
  const [edge, setEdge] = useState<'top' | 'end' | null>(null)
  // What the line SAYS, which lags what the line shows. The end of a give sets
  // `edge` back to null, and the text went straight back to SCROLL DOWN while
  // the span was still fading out — so LAST VIDEO flashed back to SCROLL DOWN
  // on its way off the screen. This holds the wording until the fade is over.
  const [said, setSaid] = useState<'top' | 'end' | null>(null)
  useEffect(() => {
    if (edge) {
      setSaid(edge)
      return
    }
    const id = window.setTimeout(() => setSaid(null), 200)
    return () => window.clearTimeout(id)
  }, [edge])
  // SCROLL DOWN has said its piece once the feed has moved off the reel it
  // opened on, and does not come back if the visitor scrolls up again.
  const [hint, setHint] = useState(true)
  const lastTouch = useRef<number | null>(null)
  const scrolledAt = useRef(0)
  /** On the last reel the only way on is back up, so the standing hint moves to
   *  the top and turns round. */
  const onLast = current === reels.length - 1

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

  /** How far the reels give when there is nothing past them. */
  const MAX_PULL = 52

  /** A gesture the feed cannot act on because there is nothing that way.
   *
   *  This used to follow the gesture: every wheel event fed a value that a
   *  rAF loop eased back, painted frame by frame. It was never smooth, and
   *  could not be — a trackpad's deltas are irregular, so a give that tracks
   *  them is irregular too, and it was moving a box holding every reel's
   *  iframe on the main thread while it did.
   *
   *  So the give is now a fixed movement rather than a followed one: out and
   *  back, the same every time, handed to the compositor as one animation and
   *  left alone. It is over in under half a second and further pushes during it
   *  are ignored, so a long flick makes one clean bounce instead of a stutter. */
  const bouncing = useRef(false)
  const pushedAt = useRef(0)
  const bounce = (down: boolean) => {
    const el = scroller.current
    if (!el) return
    // A flick keeps arriving for longer than the bounce lasts, so by the time
    // the animation had finished the tail was still coming and the first event
    // past it started a second one — the same give twice over. The next bounce
    // waits until the pushing has actually stopped, which every event pushes
    // back, whether it is acted on or not.
    const now = performance.now()
    const stopped = now - pushedAt.current > 220
    pushedAt.current = now
    if (bouncing.current || !stopped) return
    bouncing.current = true
    setEdge(down ? 'end' : 'top')
    const to = down ? -MAX_PULL : MAX_PULL
    const run = el.animate(
      [
        // out, quickly and then settling
        { transform: 'translateY(0)', easing: 'cubic-bezier(.22, 1, .36, 1)' },
        // and held there a moment, which is what makes it read as an answer
        // rather than a twitch
        { transform: `translateY(${to}px)`, offset: 0.26, easing: 'linear' },
        { transform: `translateY(${to}px)`, offset: 0.56, easing: 'cubic-bezier(.4, 0, .2, 1)' },
        { transform: 'translateY(0)' },
      ],
      { duration: 620, easing: 'linear' },
    )
    // the line is gone as the reel lands, not after it
    window.setTimeout(() => setEdge(null), 460)
    const done = () => {
      bouncing.current = false
    }
    run.onfinish = done
    run.oncancel = done
  }

  // The browser does the scrolling. It is instant, it is smooth, and with
  // `scroll-snap-stop: always` on the slides it already stops at every reel
  // rather than flying through three. Taking the wheel over and stepping the
  // scroller by hand, as this did, put every move behind a programmatic smooth
  // scroll and behind guesses about which events were a gesture and which were
  // its tail — which is what made it feel unresponsive and late.
  //
  // All that is left to us is the two ends, where there is nothing to scroll
  // and so nothing to interfere with.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    const onScroll = () => {
      scrolledAt.current = performance.now()
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return
      const down = e.deltaY > 0
      const stuck = down
        ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1
        : el.scrollTop <= 1
      if (!stuck) return
      // Landing on the first or last reel does not mean the visitor is asking
      // for more. A flick that ends there keeps arriving for a moment after the
      // scroller has stopped, and taking that as a push made the reel bob the
      // instant it settled. Once it has been still, a push is a push.
      if (performance.now() - scrolledAt.current < 220) return
      // ...and a trackpad reports specks of movement in the axis you are not
      // using. They are not a gesture, and acting on them made the reel twitch
      // while it was sitting at the top doing nothing.
      if (Math.abs(e.deltaY) < 8) return
      e.preventDefault()
      bounce(down)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // a swipe moves the feed itself, so the hint goes the moment it lands
  useEffect(() => {
    if (current !== startAt) setHint(false)
  }, [current, startAt])

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

      {/* The two lines sit in the clear space above and below the reel, each
          centred in it. That space is not the padding alone: a reel is capped
          at 960px, so on a tall screen it stops short of the padding and the
          gap is larger — hence the height is worked out from the same numbers
          the reel is, rather than fixed to the padding and left looking high.
          They stand outside the scroller, so they hold still while the reels
          give, but BEFORE it, so a reel scrolling past covers them rather than
          riding under them. Neither takes a click: the space around a reel
          closes the feed. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center"
        style={{ height: GAP }}
      >
        <span
          className={`flex items-center gap-2 uppercase tracking-[0.2em] transition-opacity duration-[160ms] ${
            said === 'top' ? 'text-[1rem] text-white' : 'text-[0.7rem] text-white/55'
          } ${edge === 'top' || (onLast && hint) ? 'opacity-100' : 'opacity-0'}`}
        >
          {said === 'top' ? (
            t('atTop')
          ) : (
            <>
              <Arrow up />
              {t('scrollUp')}
            </>
          )}
        </span>
      </div>
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center"
        style={{ height: GAP }}
      >
        <span
          className={`flex items-center gap-2 uppercase tracking-[0.2em] transition-opacity duration-[160ms] ${
            said === 'end' ? 'text-[1rem] text-white' : 'text-[0.7rem] text-white/55'
          } ${edge === 'end' || (hint && !onLast) ? 'opacity-100' : 'opacity-0'}`}
        >
          {said === 'end' ? (
            t('atEnd')
          ) : (
            <>
              {t('scrollDown')}
              <Arrow />
            </>
          )}
        </span>
      </div>

      {/* one reel per screen; snapping so a flick lands on a whole one */}
      <div
        ref={scroller}
        // Lenis ignores wheel/touch that starts inside a [data-lenis-prevent],
        // which is how the chat body scrolls inside the start-a-project panel.
        // Without it this scroller gets nothing and the page moves instead.
        data-lenis-prevent
        data-current={current}
        onTouchStart={(e) => {
          lastTouch.current = e.touches[0].clientY
        }}
        onTouchMove={(e) => {
          const el = scroller.current
          const y = e.touches[0].clientY
          const dy = (lastTouch.current ?? y) - y
          lastTouch.current = y
          if (!el || Math.abs(dy) < 4) return
          if (performance.now() - scrolledAt.current < 220) return
          const down = dy > 0
          const stuck = down
            ? el.scrollTop + el.clientHeight >= el.scrollHeight - 1
            : el.scrollTop <= 1
          if (stuck) bounce(down)
        }}
        onTouchEnd={() => {
          lastTouch.current = null
        }}
        // no transition on the transform: the give is painted frame by frame
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
            className="flex h-full snap-start snap-always items-center justify-center px-[var(--gutter)] py-[3.25rem]"
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
