'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import VimeoEmbed from '@/components/VimeoEmbed'
import { useLenis } from '@/components/LenisProvider'

const HEADER_OFFSET = 120

interface VideoMedia {
  _type: 'videoMedia'
  _key: string
  type: 'video'
  vimeoUrl?: string
}

interface ImageMedia {
  _type: 'imageMedia' | 'image'
  _key: string
  type: 'image'
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  image?: { asset: { _ref: string } }
}

type MediaBlock = VideoMedia | ImageMedia

interface ThumbnailImage {
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  crop?: { top: number; bottom: number; left: number; right: number }
}

interface ContentStackProps {
  media?: MediaBlock[]
  thumbnail?: ThumbnailImage
  thumbnailVideo?: string
  thumbnailType?: string
}

interface StackItem {
  type: 'image' | 'video'
  key: string
  content: React.ReactNode
  // Small image source for the thumbnail rail (null → video/no-image placeholder)
  thumbSource: ThumbnailImage | { asset: { _ref: string } } | null
}

function getImageRef(img: ImageMedia): string | null {
  if (img.asset?._ref) return img.asset._ref
  if (img.image?.asset?._ref) return img.image.asset._ref
  return null
}

function getImageSource(img: ImageMedia) {
  if (img.asset?._ref) return img
  if (img.image?.asset?._ref) return img.image
  return null
}

function radiusClass(index: number, total: number): string {
  if (total === 1) return 'rounded-2xl'
  if (index === 0) return 'rounded-t-2xl'
  if (index === total - 1) return 'rounded-b-2xl'
  return ''
}

export default function ContentStack({
  media,
  thumbnail,
  thumbnailVideo,
  thumbnailType,
}: ContentStackProps) {
  const items: StackItem[] = []

  // Thumbnail as first item
  if (thumbnailType === 'video' && thumbnailVideo) {
    items.push({
      type: 'video',
      key: 'thumb-video',
      content: <VimeoEmbed url={thumbnailVideo} className="aspect-[16/9] bg-bg-card" />,
      thumbSource: thumbnail?.asset?._ref ? thumbnail : null,
    })
  } else if (thumbnail?.asset?._ref) {
    items.push({
      type: 'image',
      key: 'thumb-image',
      content: (
        <Image
          loader={sanityImageLoader}
          src={urlFor(thumbnail).width(1800).quality(85).url()}
          alt=""
          width={1800}
          height={1200}
          priority
          className="h-auto w-full"
          sizes="(max-width: 959px) 100vw, 70vw"
        />
      ),
      thumbSource: thumbnail,
    })
  }

  // Media items
  if (media) {
    for (const block of media) {
      if (block._type === 'videoMedia') {
        const video = block as VideoMedia
        if (!video.vimeoUrl) continue
        items.push({
          type: 'video',
          key: video._key,
          content: <VimeoEmbed url={video.vimeoUrl} className="aspect-[16/9] bg-bg-card" />,
          thumbSource: null,
        })
      } else if (block._type === 'imageMedia' || block._type === 'image') {
        const img = block as ImageMedia
        const ref = getImageRef(img)
        if (!ref) continue
        const source = getImageSource(img)!
        items.push({
          type: 'image',
          key: img._key,
          content: (
            <Image
              loader={sanityImageLoader}
              src={urlFor(source).width(1800).quality(85).url()}
              alt=""
              width={1800}
              height={1200}
              loading="lazy"
              className="h-auto w-full"
              sizes="(max-width: 959px) 100vw, 70vw"
            />
          ),
          thumbSource: source,
        })
      }
    }
  }

  const total = items.length

  const lenis = useLenis()
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const mediaStackRef = useRef<HTMLDivElement | null>(null)
  const railRef = useRef<HTMLElement | null>(null)
  const railBtnRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrub = useRef({ active: false, moved: false, startY: 0, captured: false })
  const rafRef = useRef(0)
  const [active, setActive] = useState(0)
  // 0..1 position of the indicator line = how far we've scrolled through the media
  const [progress, setProgress] = useState(0)

  // Recompute the line position (scroll progress) and which media is in view.
  const computeState = useCallback(() => {
    const stack = mediaStackRef.current
    if (!stack) return
    const rect = stack.getBoundingClientRect()
    const stackTopDoc = rect.top + window.scrollY
    const startY = stackTopDoc - HEADER_OFFSET
    const endY = stackTopDoc + stack.offsetHeight - window.innerHeight
    const range = endY - startY
    const p = range > 0 ? (window.scrollY - startY) / range : 0
    setProgress(Math.min(1, Math.max(0, p)))
    // The media currently under the "focus line" (40% down the viewport) lights up.
    const focus = window.innerHeight * 0.4
    let a = 0
    for (let i = 0; i < total; i++) {
      const r = itemRefs.current[i]?.getBoundingClientRect()
      if (!r) continue
      if (r.top <= focus) a = i
      else break
    }
    setActive(a)
  }, [total])

  // Drag the rail to scrub through the media: the cursor's vertical position
  // over the rail maps to a scroll position across the whole media stack, so
  // dragging it moves the portfolio (like the deuxhuithuit minimap).
  const scrubTo = (clientY: number) => {
    const rail = railRef.current
    const stack = mediaStackRef.current
    if (!rail || !stack) return
    const railRect = rail.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (clientY - railRect.top) / railRect.height))
    setProgress(frac) // line follows the cursor immediately
    const stackTop = stack.getBoundingClientRect().top + window.scrollY
    const top = stackTop - HEADER_OFFSET
    const bottom = stackTop + stack.offsetHeight - window.innerHeight
    const target = top + frac * Math.max(0, bottom - top)
    if (lenis) lenis.scrollTo(target, { immediate: true })
    else window.scrollTo(0, target)
  }

  const onRailPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Mouse AND touch both initiate scrubbing. The rail has `touch-none`, so the
    // browser won't steal the vertical gesture for page scroll — a touch-drag on
    // the line scrubs the media stack, while a tap still falls through to a
    // thumbnail's click (jump).
    scrub.current = { active: true, moved: false, startY: e.clientY, captured: false }
  }
  const onRailPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!scrub.current.active) return
    if (!scrub.current.moved && Math.abs(e.clientY - scrub.current.startY) > 4) {
      // Real drag: take over the pointer (only now, so a plain click still
      // reaches a thumbnail button) and start scrubbing.
      scrub.current.moved = true
      try {
        railRef.current?.setPointerCapture?.(e.pointerId)
        scrub.current.captured = true
      } catch {
        /* ignore — capture is best-effort */
      }
    }
    if (scrub.current.moved) scrubTo(e.clientY)
  }
  const onRailPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!scrub.current.active) return
    scrub.current.active = false
    if (scrub.current.captured) {
      railRef.current?.releasePointerCapture?.(e.pointerId)
      scrub.current.captured = false
    }
  }
  // Swallow the click that follows a real drag so it doesn't also jump.
  const onRailClickCapture = (e: React.MouseEvent<HTMLElement>) => {
    if (scrub.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      scrub.current.moved = false
    }
  }

  // Drive the indicator line + active thumbnail from page scroll (rAF-throttled).
  useEffect(() => {
    if (total <= 1) return
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(computeState)
    }
    computeState()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [total, computeState])

  const scrollToItem = (i: number) => {
    itemRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (total === 0) return null

  return (
    <div className="flex justify-center gap-[var(--space-2xl)]">
      {/* Invisible left spacer mirroring the navigator so the media is centred */}
      {total > 1 && (
        <div aria-hidden className="hidden w-[42px] shrink-0 min-[960px]:block" />
      )}
      {/* Media stack — centred (capped width), the navigator sits to its right */}
      <div ref={mediaStackRef} className="flex w-full min-w-0 max-w-[1200px] flex-col">
        {items.map((item, i) => (
          <div
            key={item.key}
            ref={(el) => {
              itemRefs.current[i] = el
            }}
            data-idx={i}
            className={`relative w-full scroll-mt-[120px] overflow-hidden bg-bg-card ${radiusClass(i, total)}`}
          >
            {item.content}
          </div>
        ))}
      </div>

      {/* Thumbnail navigator — to the right of the media, sticky, drag-to-scrub */}
      {total > 1 && (
        <nav
          ref={railRef}
          aria-label="Project media"
          onPointerDown={onRailPointerDown}
          onPointerMove={onRailPointerMove}
          onPointerUp={onRailPointerUp}
          onPointerCancel={onRailPointerUp}
          onClickCapture={onRailClickCapture}
          className="sticky top-[120px] hidden w-[42px] shrink-0 cursor-grab touch-none select-none flex-col gap-[3px] self-start active:cursor-grabbing min-[960px]:flex"
        >
          {/* Continuous indicator line — tracks scroll/drag position, thicker
              and sticking out slightly past the sides of the rail. */}
          <span
            aria-hidden
            style={{ top: `${progress * 100}%` }}
            className="pointer-events-none absolute -left-[5px] -right-[5px] z-10 h-[3px] -translate-y-1/2 rounded-full bg-white/75"
          />
          {items.map((item, i) => {
            const isActive = active === i
            return (
              <button
                key={item.key}
                ref={(el) => {
                  railBtnRefs.current[i] = el
                }}
                type="button"
                onClick={() => scrollToItem(i)}
                aria-label={`Go to media ${i + 1}`}
                aria-current={isActive}
                className="group relative block aspect-[4/3] w-full shrink-0 overflow-hidden rounded-[3px]"
              >
                <span
                  className={`absolute inset-0 transition-opacity duration-300 ${
                    isActive ? 'opacity-100' : 'opacity-30 group-hover:opacity-70'
                  }`}
                >
                  {item.thumbSource ? (
                    <Image
                      loader={sanityImageLoader}
                      src={urlFor(item.thumbSource).width(150).height(112).quality(70).url()}
                      alt=""
                      fill
                      sizes="42px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-bg-elevated">
                      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-text-tertiary">
                        <path d="M5 3.5v9l7-4.5-7-4.5z" fill="currentColor" />
                      </svg>
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </nav>
      )}
    </div>
  )
}

