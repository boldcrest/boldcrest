'use client'

import { useRef, useState } from 'react'
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
  hint: string
}

/** Movement beyond this (px) counts as a drag, so the click that ends it must
 *  not also start a reel. */
const DRAG_SLOP = 6

/**
 * The reels rail. Each card is a full player (see ReelPlayer, ported from the
 * JokaDent patient reel); starting one stops whichever was playing, so only one
 * reel speaks at a time.
 */
export default function ReelsCarousel({ reels, heading, hint }: ReelsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  // which reel owns playback; null until one is started
  const [active, setActive] = useState<number | null>(null)
  // the full-screen feed, open at the reel whose button was pressed
  const [feedAt, setFeedAt] = useState<number | null>(null)

  const items = (reels ?? []).filter((r) => r.vimeoUrl)
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

  return (
    <section className="py-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)]">
        <div className="mb-[var(--space-lg)] flex items-baseline justify-between gap-4">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {heading}
          </h2>
          <p className="text-[0.7rem] uppercase tracking-[0.15em] text-text-tertiary">{hint}</p>
        </div>
      </div>

      {/* Full-bleed strip: first card lines up with the gutter, and the last one
          can scroll clear of the right edge. */}
      <div
        ref={scrollerRef}
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
              onPlay={() => setActive(i)}
              onExpand={() => setFeedAt(i)}
            />
            {reel.caption && (
              <p className="mt-3 text-[0.8rem] leading-[1.5] text-text-secondary">{reel.caption}</p>
            )}
          </div>
        ))}
      </div>

      {feedAt !== null && (
        <ReelsFeed
          reels={items}
          startAt={feedAt}
          onClose={() => {
            setFeedAt(null)
            // nothing in the rail resumes on its own when the feed closes
            setActive(null)
          }}
        />
      )}
    </section>
  )
}
