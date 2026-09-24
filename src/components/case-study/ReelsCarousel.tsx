'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import ReelPlayer from './ReelPlayer'
import ReelsFeed from './ReelsFeed'

export interface Reel {
  vimeoUrl?: string
  aspectRatio?: string
  caption?: string
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

/**
 * The reels rail. Each card is a full player (see ReelPlayer, ported from the
 * JokaDent patient reel); starting one stops whichever was playing, so only one
 * reel speaks at a time.
 */
export default function ReelsCarousel({ reels, heading }: ReelsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // which reel owns playback; null until one is started
  const [active, setActive] = useState<number | null>(null)
  // the full-screen feed: which reel it opened on, and how far that reel had
  // already played, so it carries on from there instead of starting again
  const [feed, setFeed] = useState<{ index: number; at: number } | null>(null)
  // The reel they were on last, wherever that was: the last one watched in
  // the feed before closing it, or the last card played in the rail since.
  // It follows the visitor rather than freezing on whatever opened the feed.
  const [lastSeen, setLastSeen] = useState<number | null>(null)
  // One sound setting for every reel, rail and feed alike: mute one and the
  // next starts muted, unmute one and the next starts with sound. Sound on
  // to begin with — a reel is the one thing on the site that speaks.
  const [soundOff, setSoundOff] = useState(false)

  const t = useTranslations('CaseStudy')
  // Where the rail stands, for the two anchors: dimmed at the end they cannot
  // move towards. Read from the scroller itself, so a drag, a swipe or an
  // anchor all leave the same answer.
  const [edges, setEdges] = useState({ start: true, end: false })
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const read = () => {
      setEdges({
        start: el.scrollLeft <= 1,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
      })
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
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)]">
        <div className="mb-[var(--space-lg)] flex items-baseline justify-between gap-4">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {heading}
          </h2>
          {/* The two anchors, one card a press. Hairline discs like the rest
              of the site's controls; the one with nowhere to go fades rather
              than disappears, so the pair holds its place. */}
          {items.length > 1 && (
            <div className="-my-3 flex items-center gap-2 self-center">
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
          )}
        </div>
      </div>

      {/* Full-bleed strip: first card lines up with the gutter, and the last one
          can scroll clear of the right edge. */}
      <div
        ref={scrollerRef}
        data-reel-rail
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onDragStart={(e) => e.preventDefault()}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[var(--gutter)] pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((reel, i) => (
          <div
            key={i}
            data-reel-card
            className="relative w-[62vw] shrink-0 snap-start sm:w-[38vw] md:w-[26vw] lg:w-[19vw]"
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
              onExpand={(at) => {
                setLastSeen(i)
                // stop the card behind before the feed takes over, or both
                // players run and you hear two of them
                setActive(null)
                setFeed({ index: i, at })
              }}
            />
            {reel.caption && (
              <p className="mt-3 text-[0.8rem] leading-[1.5] text-text-secondary">{reel.caption}</p>
            )}
          </div>
        ))}
      </div>

      {feed !== null && (
        <ReelsFeed
          reels={items}
          startAt={feed.index}
          resumeFrom={feed.at}
          soundOff={soundOff}
          onSoundOff={setSoundOff}
          onWatched={setLastSeen}
          onClose={() => {
            setFeed(null)
            // nothing in the rail resumes on its own when the feed closes
            setActive(null)
          }}
        />
      )}
    </section>
  )
}
