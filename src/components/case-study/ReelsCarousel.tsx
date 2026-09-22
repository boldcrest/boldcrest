'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import VimeoEmbed from '@/components/VimeoEmbed'

export interface Reel {
  vimeoUrl?: string
  aspectRatio?: string
  caption?: string
  /** Vimeo oEmbed cover, resolved server-side. Without it the card is a black
   *  box until the background player starts, and the whole rail reads as empty
   *  on first scroll — the site never shows a bare video box (see the /work
   *  cards, which use the same poster). */
  poster?: string | null
  /** The clip's true aspect, also from oEmbed. Preferred over `aspectRatio` so
   *  the card matches the footage instead of letterboxing it inside an assumed
   *  9:16 — the same reason /work sizes its slides from the native dimensions. */
  aspect?: number | null
}

interface ReelsCarouselProps {
  reels: Reel[]
  heading: string
  hint: string
  closeLabel: string
}

/** "9:16" → 0.5625. Falls back to a vertical reel, which is what these are. */
function parseAspect(ratio?: string): number {
  const [w, h] = (ratio || '9:16').split(':').map(Number)
  return w > 0 && h > 0 ? w / h : 9 / 16
}

/** Movement beyond this (px) counts as a drag, so the click that ends it must
 *  not also open the lightbox. */
const DRAG_SLOP = 6

export default function ReelsCarousel({
  reels,
  heading,
  hint,
  closeLabel,
}: ReelsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState<number | null>(null)

  // Mouse/trackpad only. On touch the native horizontal scroll is already
  // perfect — intercepting pointer events there is what makes strips feel
  // laggy and steals vertical scroll, so we simply don't.
  const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: 0 })

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    drag.current = {
      active: true,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      moved: 0,
    }
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const el = scrollerRef.current
    if (!el) return
    const dx = e.clientX - drag.current.startX
    drag.current.moved = Math.max(drag.current.moved, Math.abs(dx))
    el.scrollLeft = drag.current.startScroll - dx
  }

  const endDrag = () => {
    drag.current.active = false
  }

  // Lightbox: lock the page behind it with overflow:hidden — NEVER
  // position:fixed on body (that suppresses iOS visual-viewport behaviour and
  // is the bug that plagued the chat panel). Esc closes.
  useEffect(() => {
    if (open === null) return
    const html = document.documentElement
    const prevHtml = html.style.overflow
    const prevBody = document.body.style.overflow
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      document.body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const openReel = useCallback((i: number) => {
    // Swallow the click that merely ended a drag.
    if (drag.current.moved > DRAG_SLOP) return
    setOpen(i)
  }, [])

  const items = (reels ?? []).filter((r) => r.vimeoUrl)
  if (items.length === 0) return null

  const active = open !== null ? items[open] : null

  return (
    <section className="py-[var(--space-2xl)]">
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)]">
        <div className="mb-[var(--space-lg)] flex items-baseline justify-between gap-4">
          <h2 className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            {heading}
          </h2>
          <p className="text-[0.7rem] uppercase tracking-[0.15em] text-text-tertiary">
            {hint}
          </p>
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
          <button
            key={i}
            type="button"
            onClick={() => openReel(i)}
            aria-label={reel.caption || `Reel ${i + 1}`}
            className="group relative w-[62vw] shrink-0 snap-start text-left sm:w-[38vw] md:w-[26vw] lg:w-[19vw]"
          >
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
              <VimeoEmbed
                url={reel.vimeoUrl as string}
                aspect={reel.aspect ?? parseAspect(reel.aspectRatio)}
                poster={reel.poster}
                className="bg-bg-card"
              />
            </div>
            {reel.caption && (
              <p className="mt-3 text-[0.8rem] leading-[1.5] text-text-secondary">
                {reel.caption}
              </p>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox — the same clip, but Vimeo's native player so it has sound
          and controls. */}
      <AnimatePresence>
        {active && (
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 px-[var(--gutter)] py-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="absolute right-[var(--gutter)] top-6 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-white/70 transition-colors duration-200 hover:text-white"
            >
              {closeLabel}
            </button>

            <motion.div
              className="w-full max-w-[min(420px,80vw)]"
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              // Clicks inside the player must not fall through to the backdrop.
              onClick={(e) => e.stopPropagation()}
            >
              <div className="overflow-hidden rounded-[var(--radius-lg)]">
                <VimeoEmbed
                  url={active.vimeoUrl as string}
                  aspect={parseAspect(active.aspectRatio)}
                  feature
                  className="bg-bg-card"
                />
              </div>
              {active.caption && (
                <p className="mt-4 text-center text-[0.85rem] leading-[1.6] text-white/70">
                  {active.caption}
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
