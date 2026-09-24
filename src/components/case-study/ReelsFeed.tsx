'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { useTranslations } from 'next-intl'
import ReelPlayer from './ReelPlayer'
import type { Reel } from './ReelsCarousel'

/** The clear space above and below a reel: half of whatever the screen has
 *  left once the reel has taken its height, which is the screen minus the two
 *  3.25rem bands, or 960px, whichever is less. */
const GAP = 'calc((100% - min(100% - 6.5rem, 960px)) / 2)'

/** A reel fills a phone, so there is no clear space above or below it to put a
 *  line in: on a narrow screen the line goes inside the picture instead. */
const NARROW = '(max-width: 767px)'
const subscribeNarrow = (cb: () => void) => {
  const q = window.matchMedia(NARROW)
  q.addEventListener('change', cb)
  return () => q.removeEventListener('change', cb)
}

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
  soundOff,
  onSoundOff,
  onWatched,
  onClose,
}: {
  reels: Reel[]
  startAt: number
  /** how far the rail card had played the reel this opened on */
  resumeFrom?: number
  /** the sound setting every reel shares, held by the rail so it survives the
   *  feed closing and opening again */
  soundOff: boolean
  onSoundOff: (off: boolean) => void
  /** the reel in view, every time it changes: the rail marks the LAST one
   *  watched here, not the one that opened the feed */
  onWatched: (index: number) => void
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
  // The standing hint says its piece and goes: once the feed has moved off the
  // reel it opened on, and in any case after a few seconds. It does not come
  // back. Long enough to read a line of caps without hurrying, short enough
  // that it is not still sitting over the picture while the reel plays —
  // a second would be gone before it was noticed.
  const [hint, setHint] = useState(true)
  useEffect(() => {
    const id = window.setTimeout(() => setHint(false), 2600)
    return () => window.clearTimeout(id)
  }, [])
  const lastTouch = useRef<number | null>(null)
  const scrolledAt = useRef(0)
  /** On the last reel the only way on is back up, so the standing hint moves to
   *  the top and turns round. */
  const onLast = current === reels.length - 1
  const narrow = useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW).matches,
    () => false,
  )

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

  /** How far the reels give when there is nothing past them. On a phone the
   *  give is what uncovers LAST VIDEO, so it is sized to that line and no
   *  more: the line, with the same room above it as below. */
  const MAX_PULL = 52
  const LIFT_NARROW = 40
  /** The bar above or below a 9:16 reel on this screen, and never less than
   *  the give. */
  const STRIP_NARROW = `max(${LIFT_NARROW}px, calc((100% - min(100%, 100vw * 16 / 9)) / 2))`

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
  const clearAnswer = useRef(0)
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
    // the answer and the standing hint share one spot on a phone: a push is
    // the visitor already scrolling, so the hint has nothing left to say and
    // goes for good rather than sitting under LAST VIDEO
    setHint(false)
    // On a phone with letterbox bars the line has somewhere to appear without
    // the reel moving at all — and moving it was the wrong answer there: the
    // reel slid up under a bar that shrank to 33px while the other grew to
    // 113, and the frame read as cut top and bottom. So with bars the reel
    // holds still and only the line comes and goes; without bars (a 16:9
    // screen) the give still uncovers the strip, as it has to.
    const barH = narrow ? (window.innerHeight - Math.min(window.innerHeight, (window.innerWidth * 16) / 9)) / 2 : 0
    const lift = narrow ? (barH >= 24 ? 0 : LIFT_NARROW) : MAX_PULL
    const to = down ? -lift : lift
    // Held nine tenths of a second everywhere. The line goes with the hold — in as
    // the reel moves, out just before it comes back — so the hold IS the
    // reading time: a 300ms one on the desktop had FIRST/LAST VIDEO gone
    // before it registered, and a second and a half read as waiting.
    const hold = 900
    const out = 220
    const back = 360
    const duration = out + hold + back
    // with nothing to move, the same timing still runs so pushes are paced
    // and the line's coming and going match the other layouts exactly
    const run = el.animate(
      lift
        ? [
            { transform: 'translateY(0)', easing: 'cubic-bezier(.22, 1, .36, 1)' },
            { transform: `translateY(${to}px)`, offset: out / duration, easing: 'linear' },
            {
              transform: `translateY(${to}px)`,
              offset: (out + hold) / duration,
              easing: 'cubic-bezier(.4, 0, .2, 1)',
            },
            { transform: 'translateY(0)' },
          ]
        : [{ transform: 'translateY(0)' }, { transform: 'translateY(0)' }],
      { duration, easing: 'linear' },
    )
    // in as the reel lifts, out before it comes back down: the line is gone by
    // the time what it was sitting in is covered over again
    window.clearTimeout(clearAnswer.current)
    clearAnswer.current = window.setTimeout(() => setEdge(null), out + hold - 200)
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
  // The wheel is ours. A wheel is not a finger: a notch is a discrete click,
  // and left to the browser's snapping it took an unpredictable number of them
  // to move a reel, and sometimes moved three. So one gesture is one reel,
  // moved on a curve of our own — 320ms, eased out, started on the first
  // event so nothing waits — and everything that arrives while it moves, or
  // that is only the decaying tail of the same push, is swallowed. A NEW push
  // is a gap since the last event, or a delta larger than the one before it;
  // a tail is neither. Touch is left to the browser, which moves a screen at
  // a time on its own.
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    // Snapping is for a finger. Under a wheel it fought the step: every
    // in-between scrollTop we set was pulled to the nearest reel before the
    // next frame, so a step was a jump — two positions, nothing between. On
    // a mouse or trackpad the scroller is not snapped at all; we land it.
    const wheelDriven = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (wheelDriven) el.style.scrollSnapType = 'none'
    const onScroll = () => {
      scrolledAt.current = performance.now()
    }
    let raf = 0
    let moving = false
    let lastAt = 0
    let lastMag = 0
    const glide = (to: number) => {
      cancelAnimationFrame(raf)
      const from = el.scrollTop
      const t0 = performance.now()
      const D = 380
      moving = true
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / D)
        // a reel's move: away quickly, landing softly
        const e = 1 - Math.pow(1 - k, 4)
        el.scrollTop = from + (to - from) * e
        if (k < 1) raf = requestAnimationFrame(step)
        else moving = false
      }
      raf = requestAnimationFrame(step)
    }
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || !e.deltaY) return
      const now = performance.now()
      const mag = Math.abs(e.deltaY)
      const gap = now - lastAt
      const grew = mag > lastMag * 1.4
      lastAt = now
      lastMag = mag
      const down = e.deltaY > 0
      const h = el.clientHeight
      const here = Math.round(el.scrollTop / h)
      const stuck = down ? here >= reels.length - 1 : here <= 0
      e.preventDefault()
      // a step still under way, or the tail of the push just acted on: not
      // a new ask, whichever way it points
      if (moving) return
      if (gap < 80 && !grew) return
      if (stuck) {
        // nothing that way: the feed gives instead of moving — at once, on the
        // next push after landing here, not after a wait. Specks (a trackpad's
        // stray movement in the axis not in use) are not a push.
        if (mag < 8) return
        bounce(down)
        return
      }
      glide((here + (down ? 1 : -1)) * h)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelAnimationFrame(raf)
      el.style.scrollSnapType = ''
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('wheel', onWheel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reels.length])

  // a swipe moves the feed itself, so the hint goes the moment it lands
  useEffect(() => {
    if (current !== startAt) setHint(false)
  }, [current, startAt])

  useEffect(() => {
    onWatched(current)
  }, [current, onWatched])

  // ...and an answer about one end does not belong on a reel at the other
  useEffect(() => {
    window.clearTimeout(clearAnswer.current)
    setEdge(null)
  }, [current])

  useEffect(() => () => window.clearTimeout(clearAnswer.current), [])

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
    const html = document.documentElement
    const prev = {
      overflow: body.style.overflow,
      overscroll: body.style.overscrollBehavior,
      htmlOverscroll: html.style.overscrollBehavior,
      htmlBg: html.style.backgroundColor,
    }
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    // iOS can still rubber-band the PAGE under a hard drag, and the colour it
    // shows beyond the document is the root's — light unless told otherwise.
    // Neither the bounce nor a light ground has any place under a reel.
    html.style.overscrollBehavior = 'none'
    html.style.backgroundColor = '#0a0a0a'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      body.style.overflow = prev.overflow
      body.style.overscrollBehavior = prev.overscroll
      html.style.overscrollBehavior = prev.htmlOverscroll
      html.style.backgroundColor = prev.htmlBg
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

  /** FIRST VIDEO or LAST VIDEO: the answer to a push at that end. It is a line
   *  of its own rather than a change of wording in the hint — sharing one span
   *  meant the wording had to be held back while the span faded out, or LAST
   *  VIDEO flashed to SCROLL DOWN on its way off. */
  const answer = (where: 'top' | 'end') => (
    <span
      className={`flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.2em] text-white/70 transition-opacity duration-[160ms] ${
        edge === where ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {t(where === 'top' ? 'atTop' : 'atEnd')}
      {/* and the one way on from here: down from the first, up from the last */}
      <Arrow up={where === 'end'} />
    </span>
  )

  /** Which ways there are to go from the reel in view: down from the first, up
   *  from the last, both from anywhere in between. Every arrow sits after the
   *  words, whichever way it points — one ahead and one behind read as brackets
   *  round the line rather than as the two ways out of it. */
  const standing = () => {
    const onFirst = current === 0
    const alone = reels.length <= 1
    // Only ever on the reel the feed opened on. `hint` is cleared by an effect
    // once `current` moves, which is one render late: the corner had already
    // moved to the next reel and painted SCROLL UP/DOWN there for a frame
    // before fading it. Checked here, the next reel never gets it at all.
    const shown = hint && !alone && current === startAt
    return (
      <span
        // The slow fade is for going of its own accord. When an answer takes
        // the cell it shares on a phone, the hint has to be gone at once —
        // 600ms of it dissolving under LAST VIDEO read as the two smeared
        // together.
        className={`flex items-center gap-2 text-[0.8rem] uppercase tracking-[0.2em] text-white/55 transition-opacity ${
          edge ? 'duration-0' : 'duration-[600ms]'
        } ${shown ? 'opacity-100' : 'opacity-0'}`}
      >
        {onLast ? (
          <>
            {t('scrollUp')}
            <Arrow up />
          </>
        ) : onFirst ? (
          <>
            {t('scrollDown')}
            <Arrow />
          </>
        ) : (
          <>
            {t('scrollBoth')}
            <span className="flex items-center gap-1">
              <Arrow up />
              <Arrow />
            </span>
          </>
        )}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-[1800]" role="dialog" aria-modal="true">
      {/* the same dim and blur start-a-project puts over the site */}
      <div
        aria-hidden
        // On a phone the reel is the whole screen, so the dim-and-blur is never
        // seen — except when iOS drags the scroller past its end and shows
        // what is under it, which was the site. Solid ground there instead:
        // whatever is uncovered is black.
        className={`absolute inset-0 ${
          narrow
            ? 'bg-bg'
            : 'bg-black/40 [@media(min-width:700px)_and_(min-height:700px)]:backdrop-blur-[6px] [@media(pointer:fine)]:backdrop-blur-[6px]'
        }`}
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
          closes the feed.

          On a phone there is no such space — the reel fills the screen — so
          both lines move inside the picture instead, top left, and these are
          not rendered at all. */}
      {!narrow && (
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-center"
            style={{ height: GAP }}
          >
            <div className="grid justify-items-center">
              <div className="[grid-area:1/1]">{answer('top')}</div>
              {onLast && <div className="[grid-area:1/1]">{standing()}</div>}
            </div>
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center"
            style={{ height: GAP }}
          >
            <div className="grid justify-items-center">
              <div className="[grid-area:1/1]">{answer('end')}</div>
              {!onLast && <div className="[grid-area:1/1]">{standing()}</div>}
            </div>
          </div>
        </>
      )}

      {/* On a phone there is no standing band: the reel fills the screen. LAST
          VIDEO lives UNDER the scroller, so pushing past the last reel lifts
          the reel off it and uncovers it for as long as the push is held, and
          putting the reel back covers it again. Lined up with the play GLYPH,
          not the button round it — the button is a 40px tap target with a 20px
          mark centred in it, so matching the button's own left edge left the
          line 10px to the left of the triangle above it. */}
      {narrow && (
        // The GROUND at each end, under the scroller, on the player's own
        // colour. It only matters on a screen with no bars, where the give
        // lifts the reel 40px off it: what is uncovered must read as the
        // player's, never as the page behind showing through — which it did
        // once, blurred, with the rail's captions in it. No words live here;
        // they are all in the reel's corner.
        <>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 bg-bg"
            style={{ height: STRIP_NARROW }}
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 bg-bg"
            style={{ height: STRIP_NARROW }}
          />
        </>
      )}

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
        // overscroll NONE, not contain: contain only stops the scroll reaching
        // the page, it keeps the rubber-band, and on iOS that dragged the reel
        // a screen's worth off its end and showed the site behind. None stops
        // the bounce too; the only give at the ends is the feed's own.
        className="relative h-full snap-y snap-mandatory overflow-y-auto overscroll-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            className={`relative flex h-full snap-start snap-always items-center justify-center ${
              // On a phone the reel is 9:16 at the full width and whatever the
              // screen has left over is bars, above and below, on the player's
              // own ground — the way a video player letterboxes, rather than
              // the page showing through round a picture.
              narrow ? 'bg-bg' : 'px-[var(--gutter)] py-[3.25rem]'
            }`}
          >
            <div
              className={
                narrow
                  ? // full height, and centring the frame in it: the frame is
                    // shorter than the screen, and the bars must be even
                    'flex h-full w-full items-center justify-center'
                  : 'h-full max-h-[min(100%,960px)] w-auto max-w-full'
              }
            >
              {/* A 9:16 frame, as tall as the screen allows but no wider than
                  it is — height alone gave a 398px reel on a 375px phone,
                  cropped either side, and with the height definite and an
                  aspect ratio set, max-width cannot claw it back, so the width
                  limit has to be folded into the height itself. On a phone
                  there is no gutter, so the frame runs edge to edge and the
                  screen's extra height falls into bars above and below. A clip
                  that is not 9:16 itself (SanFest's is 3:4) sits letterboxed
                  INSIDE the frame: the reel keeps its shape, the clip keeps
                  its own, and nothing is cropped. */}
              <div
                className="relative mx-auto"
                style={{
                  aspectRatio: '9 / 16',
                  height: narrow
                    ? 'min(100%, calc(100vw * 16 / 9))'
                    : 'min(100%, calc((100vw - 2 * var(--gutter)) * 16 / 9))',
                }}
              >
                {/* On a phone the line lives in the picture's top-left corner,
                    over the player but clear of its close button on the right.
                    Only for the reel in view: the ones either side are built
                    ahead and would carry a line of their own into sight. */}
                {narrow && i === current && (
                  <>
                    {/* Every line the feed has to say, in the one place on a
                        phone: level with the close mark opposite (the same
                        48px box, so whichever line is showing centres on the
                        X rather than sitting above it) and on the play glyph's
                        own left, 22px in, with the title under it.
                        The three are stacked in one grid cell, not a column,
                        whose height would depend on which of them is there. */}
                    <div className="pointer-events-none absolute left-[1.375rem] top-3 z-[45] grid h-12 items-center justify-items-start">
                      <div className="[grid-area:1/1]">{standing()}</div>
                      <div className="[grid-area:1/1]">{answer('top')}</div>
                      <div className="[grid-area:1/1]">{answer('end')}</div>
                    </div>
                    {/* and the other end's answer under the play button, in the
                        band the transport leaves when it lifts off the bottom
                        edge on a phone */}
                  </>
                )}
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
                  fill={narrow}
                  soundOff={soundOff}
                  onSoundOff={onSoundOff}
                  // on a phone the lines sit in the reel's corner, on a shade
                  // that comes and goes with whichever of them is showing
                  shadeTop={
                    narrow && i === current
                      ? edge !== null || (hint && reels.length > 1 && current === startAt)
                      : undefined
                  }
                  shadeQuick={edge !== null}
                />
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
