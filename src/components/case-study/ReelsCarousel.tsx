'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import ReelPlayer from './ReelPlayer'

export interface Reel {
  vimeoUrl?: string
  aspectRatio?: string
  caption?: string
  /** a sentence or two under the title */
  description?: string
  /** Vimeo oEmbed cover, resolved server-side. Without it the card is a black
   *  box until the player is touched, and the whole rail reads as empty on
   *  first scroll — the site never shows a bare video box. */
  poster?: string | null
}

interface ReelsCarouselProps {
  reels: Reel[]
  heading: string
}

/** Movement beyond this (px) counts as a drag, so the click that ends it must
 *  not also start a reel. */
const DRAG_SLOP = 6
/** The full-screen frame on a desktop screen: 9:16, as tall as the screen
 *  allows less a band above and below, capped, never wider than the gutters
 *  leave, centred. The same numbers the picture viewer uses for its frame. */
function fullFrame() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 64
  const height = Math.min(vh - 104, 960, (vw - 2 * gutter) * (16 / 9))
  const width = height * (9 / 16)
  return { x: (vw - width) / 2, y: (vh - height) / 2, width, height }
}

/**
 * The reels rail. Each card is a full player (see ReelPlayer, ported from the
 * JokaDent patient reel); starting one stops whichever was playing, so only one
 * reel speaks at a time.
 */
export default function ReelsCarousel({ reels, heading }: ReelsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // which reel owns playback; null until one is started
  const [active, setActive] = useState<number | null>(null)
  // The reel they were on last, wherever that was: the last one watched
  // full screen before closing it, or the last card played in the rail
  // since. It follows the visitor rather than freezing on whatever opened.
  const [lastSeen, setLastSeen] = useState<number | null>(null)
  // One sound setting for every reel, rail and full screen alike: mute one
  // and the next starts muted, unmute one and the next starts with sound.
  // Sound on to begin with — a reel is the one thing on the site that speaks.
  const [soundOff, setSoundOff] = useState(false)
  // Full screen on a desktop is the card's OWN player, lifted off the rail
  // and grown to the frame, playing all the while; the rest of the rail is
  // loaded into that one player by its anchors (see ReelPlayer, liftTo).
  // One player, so nothing is ever handed over or seen to reload.
  const [lift, setLift] = useState<{ index: number; rect: { x: number; y: number; width: number; height: number } } | null>(null)
  // The size the player has when it is up, known before it goes up: the cards
  // lay their player out at this size from the start and scale it down, so
  // opening and closing full screen never resizes (and re-renders) the player.
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null)
  useEffect(() => {
    const measure = () => {
      const f = fullFrame()
      setFrameSize((cur) => (cur && cur.width === f.width && cur.height === f.height ? cur : { width: f.width, height: f.height }))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  // The rail's fit. When the whole rail would end within a third of a card
  // of the measure's right edge (the arrows' edge), the cards are sized so
  // it ends exactly there, grown or shrunk a little; a rail that overruns by
  // more keeps the design's card size and the last card scrolls clear of
  // the screen. Measured from the heading's box, which is the measure.
  const measure = useRef<HTMLDivElement>(null)
  const [fitWidth, setFitWidth] = useState<number | null>(null)
  // the measure's left edge, for the strip's padding: computed, not written
  // as CSS, since 100vw counts the scrollbar and the centred measure does not
  const [inset, setInset] = useState<number | null>(null)
  // how much of the next card shows at the column's right edge (0: none does)
  const [peek, setPeek] = useState(0)
  const count = (reels ?? []).filter((r) => !!r.vimeoUrl).length
  useEffect(() => {
    const el = measure.current
    if (!el) return
    const read = () => {
      const w = el.clientWidth
      const vw = window.innerWidth
      // The rail lives inside the column on every screen (the gutters, on a
      // phone) and has no padding of its own.
      setInset(0)
      // The card's design size and the gap, as the classes below set them —
      // but reckoned against the column, not the screen: on a wide screen the
      // column stops at 1200px and a card sized off the screen's width put
      // four of them far past its right edge.
      const gutter = el.getBoundingClientRect().left
      const base = Math.min(vw, w + 2 * Math.min(gutter, 64))
      const nominal = base * (vw >= 1024 ? 0.19 : vw >= 768 ? 0.26 : vw >= 640 ? 0.38 : 0.62)
      const gap = vw >= 768 ? 24 : 16
      const total = count * nominal + (count - 1) * gap
      // More reels than the column shows (four on a wide one): the cards are
      // sized so that many stand whole and the next one shows by two fifths,
      // under the fade at the column's right edge — a rail that says it goes on.
      // on a phone two stand whole and the third shows by half
      const shown = w >= 1000 ? 4 : w >= 700 ? 3 : 2
      const part = w >= 700 ? 0.4 : 0.5
      if (count > shown) {
        const cardW = (w - shown * gap) / (shown + part)
        setFitWidth(cardW)
        setPeek(cardW * part)
      } else {
        setFitWidth(total <= w + nominal / 3 ? (w - (count - 1) * gap) / count : null)
        setPeek(0)
      }
    }
    read()
    const ro = new ResizeObserver(read)
    ro.observe(el)
    // the column keeps its width while the window changes around it, so its
    // left edge moves without the observer hearing of it
    window.addEventListener('resize', read)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', read)
    }
  }, [count])

  const t = useTranslations('CaseStudy')
  // Where the rail stands, for the two anchors: dimmed at the end they cannot
  // move towards. Read from the scroller itself, so a drag, a swipe or an
  // anchor all leave the same answer.
  const [edges, setEdges] = useState({ start: true, end: false })
  const [fade, setFade] = useState(1)
  const [leftFade, setLeftFade] = useState({ width: 0, opacity: 0 })
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const read = () => {
      setEdges({
        start: el.scrollLeft <= 1,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      })
      // The fade over the card still to come goes as the last card comes in:
      // it follows the scroll across the rail's final step, so it is gone in
      // the frame the last reel reaches its place, not a moment after.
      const max = el.scrollWidth - el.clientWidth
      const left = max - el.scrollLeft
      const card = el.querySelector<HTMLElement>('[data-reel-card]')
      const stepW = card ? card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : max
      const span = Math.max(1, Math.min(stepW, max))
      setFade(max <= 1 ? 0 : Math.max(0, Math.min(1, left / span)))
      // The other side: the rail snaps to a card's left edge, except at its
      // very end, where the last card sets the place and a card is left cut
      // on the left. That one gets the same fade, as wide as what shows of
      // it, coming in as the card is cut.
      const cardW = card ? card.offsetWidth : 0
      const cut = stepW > 0 ? el.scrollLeft % stepW : 0
      if (cardW && cut > 1 && cut < cardW - 1) setLeftFade({ width: cardW - cut, opacity: Math.min(1, cut / 60) })
      else setLeftFade({ width: 0, opacity: 0 })
    }
    read()
    el.addEventListener('scroll', read, { passive: true })
    const ro = new ResizeObserver(read)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', read)
      ro.disconnect()
    }
  }, [])
  // One card per press: a card's width plus the gap after it, measured rather
  // than assumed, so the step stays true at every breakpoint.
  const step = (dir: -1 | 1) => {
    const el = scrollerRef.current
    const card = el?.querySelector<HTMLElement>('[data-reel-card]')
    if (!el || !card) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: 'smooth' })
  }

  const items = (reels ?? []).filter((r): r is Reel & { vimeoUrl: string } => !!r.vimeoUrl)
  if (items.length === 0) return null

  const anchors = items.length > 1 && (
    <div className="flex items-center gap-2">
      {([-1, 1] as const).map((dir) => {
        const off = dir < 0 ? edges.start : edges.end
        return (
          <button
            key={dir}
            type="button"
            onClick={() => step(dir)}
            aria-label={dir < 0 ? t('previous') : t('next')}
            aria-disabled={off}
            tabIndex={off ? -1 : 0}
            className={`flex h-9 w-9 items-center justify-center rounded-full border border-border text-text-primary transition-[opacity,border-color,background-color] duration-300 hover:border-border-hover hover:bg-white/5 ${
              off ? 'pointer-events-none opacity-30' : 'opacity-100'
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {dir < 0 ? <path d="M15 5l-7 7 7 7" /> : <path d="M9 5l7 7-7 7" />}
            </svg>
          </button>
        )
      })}
    </div>
  )

  // Mouse/trackpad only. On touch the native horizontal scroll is already
  // perfect — intercepting pointer events there is what makes strips feel
  // laggy and steals vertical scroll, so we simply don't.
  const drag = { active: false, startX: 0, startScroll: 0, moved: 0 }
  const state = { current: drag }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    state.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft, moved: 0 }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = state.current
    const el = scrollerRef.current
    if (!d.active || !el) return
    const dx = e.clientX - d.startX
    d.moved = Math.max(d.moved, Math.abs(dx))
    if (d.moved > DRAG_SLOP) el.scrollLeft = d.startScroll - dx
  }
  const endDrag = () => {
    state.current.active = false
  }

  // One step (space-xl) from the write-up to the rail's heading, then the
  // article's own heading-to-content step (space-lg) to the cards: the same
  // rhythm the feed follows below, so the three read as one page, not three
  // sections stacked.
  return (
    <section className="pt-[var(--space-xl)]">
      {/* On the page's column (1200px, centred): the heading's box is what the
          rail measures itself against, so the first card starts on the
          column's left edge and the cards are sized to fill its width. */}
      <div className="mx-auto max-w-[calc(1200px+2*var(--gutter))] px-[var(--gutter)]">
        <div ref={measure} className="mb-[var(--space-lg)]">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {heading}
          </h2>
        </div>
      </div>

      {/* The strip stays inside the column (the gutters, on a phone): it ends
          on the column's right edge, where a card that is still to come shows
          under a fade of the page's own black. */}
      <div className="mx-auto max-w-[calc(1200px+2*var(--gutter))] px-[var(--gutter)]">
      <div className="relative">
      {/* The fade is as wide as the part of the next card that shows and no
          wider, so the last whole card is left clean. It reaches a pixel past
          the rail's edge: the two are laid out at fractions of a pixel and a
          hairline of the card showed unfaded between them. The left one is
          for the rail's end, the one place a card is cut on that side.
          Above everything a card draws (its play button stood at z-20 and
          showed through a fade at z-10), below a lifted reel (z-1850). */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 z-[100] bg-gradient-to-l from-bg from-[2px] via-bg/75 to-transparent"
        style={{ right: -1, width: peek ? Math.ceil(peek) + 2 : 0, opacity: peek ? fade : 0 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 z-[100] bg-gradient-to-r from-bg from-[2px] via-bg/75 to-transparent"
        style={{ left: -1, width: leftFade.width ? Math.ceil(leftFade.width) + 2 : 0, opacity: leftFade.opacity }}
      />
      <div
        ref={scrollerRef}
        data-reel-rail
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        // scroll-padding matches the padding, or the snap pulls the first
        // card to the strip's very edge, a gutter left of the heading
        // the strip's padding is the measure's left edge, so the first card
        // sits under the heading on any screen, wide ones included
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
        style={inset !== null ? { paddingInline: inset, scrollPaddingInline: inset } : undefined}
      >
        {items.map((reel, i) => (
          <div
            key={i}
            data-reel-card
            className="relative w-[62vw] shrink-0 snap-start sm:w-[38vw] md:w-[26vw] lg:w-[19vw]"
            style={fitWidth !== null ? { width: fitWidth } : undefined}
          >
            <ReelPlayer
              vimeoUrl={reel.vimeoUrl as string}
              poster={reel.poster}
              caption={reel.caption}
              active={active === i}
              onPlay={() => {
                setActive(i)
                setLastSeen(i)
              }}
              lastSeen={lastSeen === i}
              soundOff={soundOff}
              onSoundOff={setSoundOff}
              // On a phone the card is the reels: its player grows and the
              // rest of the rail is loaded into it on a swipe. It gets the
              // whole rail for that, and the feed below is never opened
              // there — the player decides which by the pointer it has.
              playlist={items}
              index={i}
              onWatched={setLastSeen}
              frameSize={frameSize}
              liftTo={lift?.index === i ? lift.rect : null}
              onLiftClose={() => setLift(null)}
              onExpand={() => {
                setLastSeen(i)
                setLift({ index: i, rect: fullFrame() })
              }}
            />
            {(reel.caption || reel.description) && (
              <div className="mt-3">
                {reel.caption && (
                  // three rows at most: on a phone's narrow card a long title
                  // ran to five and pushed its description far down the page
                  <p className="line-clamp-3 text-[0.8rem] font-medium leading-[1.5] text-text-primary">{reel.caption}</p>
                )}
                {reel.description && (
                  <p className="mt-1 text-[0.8rem] leading-[1.5] text-text-secondary">{reel.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
      </div>
      {/* The two anchors, one card a press, under the rail. Hairline discs
          like the rest of the site's controls; the one with nowhere to go
          fades rather than disappears, so the pair holds its place. */}
      {anchors && (
        <div className="mx-auto mt-6 flex max-w-[calc(1200px+2*var(--gutter))] justify-end px-[var(--gutter)]">{anchors}</div>
      )}

    </section>
  )
}
