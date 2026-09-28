'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import VimeoEmbed from '@/components/VimeoEmbed'
import { useLenis } from '@/components/LenisProvider'

interface VideoMedia {
  _type: 'videoMedia'
  _key: string
  type: 'video'
  vimeoUrl?: string
  /** Native aspect ratio (w/h) resolved server-side from Vimeo oEmbed. */
  aspect?: number | null
  /** true → Vimeo's native player (sound + controls) instead of the bg loop. */
  feature?: boolean
  /** true → render side-by-side with the next 'half' item (no gap). */
  half?: boolean
  /** Cover image (Vimeo oEmbed thumbnail), resolved server-side. */
  poster?: string | null
}

interface ImageMedia {
  _type: 'imageMedia' | 'image'
  _key: string
  type: 'image'
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  image?: { asset: { _ref: string } }
  alt?: string
  /** true → render side-by-side with the next 'half' image (no gap). */
  half?: boolean
}

type MediaBlock = VideoMedia | ImageMedia

interface ThumbnailImage {
  asset?: { _ref: string }
  hotspot?: { x: number; y: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  alt?: string
}

interface ContentStackProps {
  media?: MediaBlock[]
  /** Descriptive base for image alt text, e.g. "Client — Project Name". */
  altBase?: string
  /** Appended to alt text, e.g. "Branding · BoldCrest". */
  altSuffix?: string
}

interface StackItem {
  type: 'image' | 'video'
  key: string
  content: React.ReactNode
  // Small image source for the thumbnail rail (null → video/no-image placeholder)
  thumbSource: ThumbnailImage | { asset: { _ref: string } } | null
  // External cover URL (Vimeo poster) for the rail when there's no Sanity image.
  posterUrl?: string | null
  // Native aspect ratio (w/h) of the SLIDE, so the rail thumbnail keeps the slide's
  // real proportions (square→square, tall→tall) instead of a forced/cropped box.
  aspect: number
  // true → pairs with the next 'half' item into a no-gap two-column row.
  half?: boolean
}

// Fallback when a slide's native ratio is unknown (matches the 1800×1200 default).
const FALLBACK_ASPECT = 3 / 2

// Sanity asset refs encode dimensions, e.g. `image-abc123-1200x800-jpg` → 1200/800.
function refAspect(ref: string | undefined | null): number | null {
  if (!ref) return null
  const m = ref.match(/-(\d+)x(\d+)-/)
  if (!m) return null
  const w = Number(m[1])
  const h = Number(m[2])
  return w > 0 && h > 0 ? w / h : null
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
  altBase,
  altSuffix,
}: ContentStackProps) {
  const baseAlt =
    [altBase, altSuffix].filter(Boolean).join(', ') || 'BoldCrest project'
  const items: StackItem[] = []

  // Slides come entirely from the `media` list. The cover/thumbnail is a separate
  // field (used for the card + social/OG image); a copy of it lives as the first
  // media item, so the opening slide is editable/reorderable like any other and
  // can be swapped for a different one without touching the cover.
  let firstImageRendered = false
  // Which slides will actually render as a side-by-side pair (two consecutive
  // renderable 'half' items). Known up front so a paired image can declare the
  // narrower `sizes` it really occupies — otherwise each half asks the CDN for a
  // full-slide-width candidate (≈2× the pixels, ≈3–4× the bytes), which is why the
  // second half of a pair could lag visibly behind the first.
  const pairedKeys = new Set<string>()
  if (media) {
    const renderable = media.filter((b) =>
      b._type === 'videoMedia'
        ? Boolean((b as VideoMedia).vimeoUrl)
        : (b._type === 'imageMedia' || b._type === 'image') && Boolean(getImageRef(b as ImageMedia)),
    )
    for (let i = 0; i < renderable.length; i++) {
      const cur = renderable[i]
      const next = renderable[i + 1]
      if (cur.half && next?.half) {
        pairedKeys.add(cur._key)
        pairedKeys.add(next._key)
        i++
      }
    }
  }
  if (media) {
    for (const block of media) {
      if (block._type === 'videoMedia') {
        const video = block as VideoMedia
        if (!video.vimeoUrl) continue
        items.push({
          type: 'video',
          key: video._key,
          content: (
            <VimeoEmbed
              url={video.vimeoUrl}
              aspect={video.aspect}
              feature={video.feature}
              poster={video.poster}
              className="bg-bg-card"
            />
          ),
          thumbSource: null,
          posterUrl: video.poster,
          aspect: video.aspect || FALLBACK_ASPECT,
          half: video.half,
        })
      } else if (block._type === 'imageMedia' || block._type === 'image') {
        const img = block as ImageMedia
        const ref = getImageRef(img)
        if (!ref) continue
        const source = getImageSource(img)!
        // The first image (usually the cover, now media[0]) loads eagerly for LCP;
        // the rest stay lazy.
        const isFirstImage = !firstImageRendered
        firstImageRendered = true
        // Reserve the slide's REAL aspect before the image loads. With a hardcoded
        // 1800×1200 + `h-auto`, every non-3:2 slide (portrait/square Behance frames)
        // GREW on load — thousands of px of layout shift on long portfolios, which
        // made the rail's snap positions stale mid-scroll (fast drag-scrubs and
        // clicks landed one slide short of the target). The native ratio is encoded
        // in the Sanity ref, so the box can be exact from the first paint.
        const nativeAspect = refAspect(ref) || FALLBACK_ASPECT
        items.push({
          type: 'image',
          key: img._key,
          content: (
            // Light image protection: blocks right-click "save/open image", drag-
            // to-save, and iOS long-press save. The <img> + alt stay in the DOM
            // (crawlable — no SEO impact); the transparent overlay just makes the
            // image not the direct pointer target. Not unbeatable (devtools/network
            // always work), but stops casual saving.
            <div
              className="relative select-none [-webkit-touch-callout:none]"
              onContextMenu={(e) => e.preventDefault()}
            >
              <Image
                loader={sanityImageLoader}
                src={urlFor(source).width(1800).quality(85).url()}
                alt={img.alt || baseAlt}
                width={1800}
                height={Math.round(1800 / nativeAspect)}
                {...(isFirstImage
                  ? { priority: true }
                  : { loading: 'lazy' as const })}
                draggable={false}
                className="h-auto w-full"
                sizes={
                  pairedKeys.has(img._key)
                    ? '(max-width: 959px) 50vw, 35vw'
                    : '(max-width: 959px) 100vw, 70vw'
                }
              />
              <span aria-hidden className="absolute inset-0" />
            </div>
          ),
          thumbSource: source,
          aspect: nativeAspect,
          half: img.half,
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
  // Vertical travel (px) before a press is treated as a scrub-drag instead of a
  // click. Kept generously above a typical mouse's click-drift (a few px) so an
  // intended thumbnail click reliably jumps to that item instead of being
  // misread as a scrub — which maps cursor-Y proportionally across the stack and,
  // because media have unequal heights, lands on the wrong item.
  const DRAG_THRESHOLD = 10
  const scrub = useRef({ active: false, moved: false, startY: 0, captured: false })
  // Geometry frozen at the start of a drag-scrub. The whole gesture maps the
  // finger against THIS snapshot — never live layout — so a programmatic scroll
  // mid-gesture can't feed a stale getBoundingClientRect/scrollY read back into
  // the next target and oscillate (the iPad "weird up and down" at slow speeds).
  const scrubGeom = useRef<{
    railTop: number
    railH: number
    buttons: { top: number; h: number }[]
    snaps: number[]
  } | null>(null)
  const rafRef = useRef(0)
  const [active, setActive] = useState(0)
  // 0..1 position of the indicator line = how far we've scrolled through the media
  const [progress, setProgress] = useState(0)
  // Resolved rail width (px). Normally the responsive base width; only shrinks below
  // it — uniformly, so EVERY thumbnail keeps its native aspect — when the natural
  // column (sum of aspect-derived heights) wouldn't fit the safe vertical area.
  const [railW, setRailW] = useState<number | null>(null)
  // Desktop sticky `top` offset (px). Set so the rail PINS vertically centred in the
  // viewport: it flows aligned with the portfolio top, then sticks at centre once the
  // portfolio top scrolls past. null on touch (the rail is fixed there instead).
  const [railTop, setRailTop] = useState<number | null>(null)
  // Desktop horizontal nudge (px, ≤ 0). On wide screens the rail sits at its natural
  // gap right of the portfolio (shift 0). As the window narrows and the rail would get
  // pushed toward the screen edge, we slide it LEFT so it sits centred in the gutter
  // between the portfolio's right edge and the screen edge (equal black bars either
  // side). Never shifts right, so wide layouts are untouched.
  const [railShiftX, setRailShiftX] = useState(0)
  // Latest per-slide native aspects, read by the width effect on resize.
  const aspectsRef = useRef<number[]>([])
  aspectsRef.current = items.map((it) => it.aspect)

  // Per-item "snap" = the scroll position that CENTERS item i in the viewport,
  // clamped to the document's real scroll range. (Top-aligning to the header left
  // a near-viewport-tall slide's center well below the screen center — it read as
  // "slightly lowered".) EVERYTHING (active item, indicator line, drag-scrub) is
  // expressed against these snaps so the rail shares ONE coordinate system with the
  // thumbnails: marker on a thumbnail ⇒ that slide centered on screen.
  const getSnaps = useCallback(() => {
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    )
    const y = window.scrollY
    const half = window.innerHeight / 2
    const snaps: number[] = []
    for (let i = 0; i < total; i++) {
      const el = itemRefs.current[i]
      const r = el?.getBoundingClientRect()
      const docCenter = r ? r.top + y + r.height / 2 : 0
      snaps[i] = Math.min(Math.max(0, docCenter - half), maxScroll)
    }
    return snaps
  }, [total])

  // Vertical center of thumbnail i within the rail (px), used to place the line.
  const thumbCenter = (i: number) => {
    const b = railBtnRefs.current[i]
    return b ? b.offsetTop + b.offsetHeight / 2 : 0
  }

  // Recompute the indicator-line position (in thumbnail space) and the active item.
  const computeState = useCallback(() => {
    const rail = railRef.current
    if (!rail || total === 0) return
    // While a drag is actively scrubbing, scrubTo owns the marker (it follows the
    // finger). Bailing here stops the scroll-driven value from fighting it every
    // frame. Gated on `active` too so the marker resumes the moment the finger
    // lifts (`moved` lingers until the next press, to suppress the drag's click).
    if (scrub.current.active && scrub.current.moved) return
    const snaps = getSnaps()
    const y = window.scrollY
    // active = last item whose snap we've reached; f = progress toward the next.
    let a = 0
    for (let i = 0; i < total; i++) {
      if (y + 1 >= snaps[i]) a = i
      else break
    }
    let f = 0
    if (a < total - 1) {
      const span = snaps[a + 1] - snaps[a]
      f = span > 0 ? Math.min(1, Math.max(0, (y - snaps[a]) / span)) : 0
    }
    // Highlight the thumbnail the indicator line is NEAREST to (round of the
    // continuous position a+f), not "the last hard threshold crossed". The walk's
    // `y+1 >= snaps[i]` boundary is 1px thin, so when a snap shifts a little — lazy
    // images resolving, or the mobile toolbar changing innerHeight mid-scroll, which
    // moves every snap — the LAST boundary flip-flops and the highlight drops back to
    // the previous slide while the line sits on the last one. Rounding ties the bright
    // slide to the visible line (its decision boundary is the wide midpoint between
    // snaps), so the last slide lights up and holds.
    setActive(Math.min(total - 1, Math.round(a + f)))
    // Line center = active thumbnail center, interpolated toward the next by f, so
    // the marker rides exactly through the thumbnails.
    const cur = thumbCenter(a)
    const nxt = a < total - 1 ? thumbCenter(a + 1) : cur
    const railH = rail.offsetHeight || 1
    setProgress((cur + f * (nxt - cur)) / railH)
  }, [total, getSnaps])

  // Snapshot the rail + snap geometry once, at the moment a drag begins. Read
  // here (before any programmatic scroll) the values are consistent; reading them
  // again mid-gesture on iOS returns stale scroll/rect values that oscillate.
  const freezeScrubGeom = () => {
    const rail = railRef.current
    if (!rail || total === 0) return
    const y = window.scrollY
    const maxScroll = Math.max(
      0,
      document.documentElement.scrollHeight - window.innerHeight,
    )
    const half = window.innerHeight / 2
    const buttons = railBtnRefs.current.slice(0, total).map((b) => ({
      top: b ? b.offsetTop : 0,
      h: b ? b.offsetHeight : 1,
    }))
    const snaps: number[] = []
    for (let i = 0; i < total; i++) {
      const el = itemRefs.current[i]
      const r = el?.getBoundingClientRect()
      const docCenter = r ? r.top + y + r.height / 2 : 0
      snaps[i] = Math.min(Math.max(0, docCenter - half), maxScroll)
    }
    scrubGeom.current = {
      railTop: rail.getBoundingClientRect().top,
      railH: rail.offsetHeight || 1,
      buttons,
      snaps,
    }
  }

  // Drag the rail to scrub: the finger maps to the thumbnail under it (+ how far
  // through it), then to that item's snap range — so dragging over a thumbnail
  // scrolls to that media, matching a click. Everything reads from the FROZEN
  // snapshot, so the target is a pure function of the finger position (no live
  // layout reads to go stale and oscillate). The marker follows the finger.
  const scrubTo = (clientY: number) => {
    const g = scrubGeom.current
    if (!g) return
    // Scrub is mouse-only, so live layout reads are safe here (the frozen snapshot
    // existed to avoid iOS touch oscillation, a path this never runs). Reading the
    // rail's LIVE top + height keeps the cursor mapped to the right thumbnail and the
    // marker exactly under the pointer whether the rail is stuck or still scrolling.
    const rail = railRef.current
    const railTop = rail ? rail.getBoundingClientRect().top : g.railTop
    const railH = rail?.offsetHeight || g.railH
    // The resting indicator (computeState) lives in thumbnail-CENTRE space: the line
    // marks the centre of the active thumbnail, interpolated toward the next as you
    // scroll. Map the cursor through that SAME space so the marker is under the pointer
    // AND already at the portfolio's position — no jump when you release. Clamp to the
    // first/last centres so the line never points where the portfolio can't scroll.
    const centers = g.buttons.map((bt) => bt.top + bt.h / 2)
    const last = centers.length - 1
    const my = Math.min(centers[last], Math.max(centers[0], clientY - railTop))
    let i = 0
    for (let k = 0; k < last; k++) {
      if (my >= centers[k]) i = k
      else break
    }
    const c0 = centers[i]
    const c1 = i < last ? centers[i + 1] : c0
    const f = c1 > c0 ? (my - c0) / (c1 - c0) : 0
    const s0 = g.snaps[i]
    const s1 = i < g.snaps.length - 1 ? g.snaps[i + 1] : s0
    const target = s0 + f * (s1 - s0)
    setActive(Math.min(last, Math.round(i + f))) // nearest thumb to the marker (matches scroll-rest)
    setProgress(my / railH) // marker = cursor = portfolio position → no settle
    // `force` lets the jump land even though Lenis is paused for the drag.
    if (lenis) lenis.scrollTo(target, { immediate: true, force: true })
    else window.scrollTo(0, target)
  }

  const onRailPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // ONLY the mouse scrubs. Driving the scroll from JS on every touch-move fights
    // iOS WebKit (Safari AND Chrome on iPad both use WebKit): it jitters and, worse,
    // blanks the large media to black because the engine can't repaint fast enough.
    // On touch the rail is `touch-pan-y`, so a finger drag scrolls the page
    // natively (smooth, no blank-outs) and a tap still jumps to a thumbnail.
    if (e.pointerType !== 'mouse') {
      // Fully reset so a touch tap is never mistaken for a drag's trailing click.
      scrub.current = { active: false, moved: false, startY: 0, captured: false }
      return
    }
    scrub.current = { active: true, moved: false, startY: e.clientY, captured: false }
  }
  const onRailPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!scrub.current.active) return
    if (!scrub.current.moved && Math.abs(e.clientY - scrub.current.startY) > DRAG_THRESHOLD) {
      // Real drag: take over the pointer (only now, so a plain click still
      // reaches a thumbnail button) and start scrubbing.
      scrub.current.moved = true
      freezeScrubGeom() // snapshot geometry BEFORE the first programmatic scroll
      // Pause Lenis for the duration of the drag. Otherwise Lenis ALSO reads the
      // same finger as a scroll gesture (it keeps native touch listeners) and adds
      // its own delta on top of our scrubTo — the two fight and the page jitters up
      // and down. Stopped, Lenis ignores input; scrubTo drives scroll with `force`.
      lenis?.stop()
      try {
        railRef.current?.setPointerCapture?.(e.pointerId)
        scrub.current.captured = true
      } catch {
        /* ignore — capture is best-effort */
      }
    }
    if (scrub.current.moved) scrubTo(e.clientY)
  }
  // End the gesture however it finishes (up / cancel / leave). Release pointer
  // capture UNCONDITIONALLY — the old `if (!active) return` guard could skip the
  // release when a `pointercancel` had already cleared `active`, leaking the
  // capture so the rail swallowed every subsequent click ("can't pick another").
  const endRailGesture = (e: React.PointerEvent<HTMLElement>) => {
    if (scrub.current.captured) {
      try {
        railRef.current?.releasePointerCapture?.(e.pointerId)
      } catch {
        /* ignore */
      }
      scrub.current.captured = false
    }
    // A fast drag can outrun the FROZEN geometry: lazy content loading during the
    // scrub grows the document, so the frozen snaps (and Lenis's cached limit)
    // land the page short of where the marker points — most visibly at the very
    // end, where the line touched the last thumbnail but reconciled back one
    // slide. On a real drag's release, re-map the final cursor position through
    // LIVE snaps (+ a refreshed Lenis limit) and re-issue the jump. When nothing
    // changed mid-drag this recomputes the exact same target, so it's a no-op.
    const g = scrubGeom.current
    if (e.type === 'pointerup' && scrub.current.moved && g && total > 0) {
      const rail = railRef.current
      const railTop = rail ? rail.getBoundingClientRect().top : g.railTop
      const centers = g.buttons.map((bt) => bt.top + bt.h / 2)
      const last = centers.length - 1
      const my = Math.min(centers[last], Math.max(centers[0], e.clientY - railTop))
      let i = 0
      for (let k = 0; k < last; k++) {
        if (my >= centers[k]) i = k
        else break
      }
      const c0 = centers[i]
      const c1 = i < last ? centers[i + 1] : c0
      const f = c1 > c0 ? (my - c0) / (c1 - c0) : 0
      const snaps = getSnaps() // LIVE snaps — the frozen ones may be stale by now
      const s0 = snaps[i]
      const s1 = i < snaps.length - 1 ? snaps[i + 1] : s0
      const target = s0 + f * (s1 - s0)
      lenis?.resize() // refresh the cached limit so the jump isn't clamped short
      if (lenis) lenis.scrollTo(target, { immediate: true, force: true })
      else window.scrollTo(0, target)
    }
    scrub.current.active = false
    scrubGeom.current = null
    // Resume Lenis (idempotent — safe even if this gesture was only a tap and we
    // never stopped it). Its internal position is already synced via scrubTo.
    lenis?.start()
    // Reconcile the marker to the settled scroll position (active is now false, so
    // computeState no longer bails) — snaps the line onto the final thumbnail.
    computeState()
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

  // ≥960px touch (iPad): the rail keeps a narrow 32px reservation in flow (so the
  // portfolio doesn't move) while its wider visual column is floated into the right
  // gutter via the SAME sticky-centre + transform path as desktop (see the width
  // effect below). `isTouch` only gates that 32px reservation; it's set there.
  const [isTouch, setIsTouch] = useState(false)

  // Resolve the rail width. Thumbnails are NEVER cropped or squashed — each keeps its
  // slide's native aspect, so its height is just width / aspect. The only lever we
  // have to make a long column fit the safe vertical area is the shared width: if the
  // natural column (Σ width/aspect + gaps) overflows, we reduce the width uniformly,
  // which scales every thumbnail down proportionally and preserves all aspects. When
  // it already fits, we use the full responsive base width — no shrinking.
  const lastViewport = useRef({ w: 0, h: 0 })
  useEffect(() => {
    if (total <= 1) return
    const GAP = 3 // matches the rail's gap-[3px]; kept constant so spacing is uniform
    const MIN_W = 20
    const compute = (force: boolean) => {
      const iw = window.innerWidth
      const ih = window.innerHeight
      const coarse = window.matchMedia('(pointer: coarse)').matches && iw >= 960
      // On TOUCH, ignore the small innerHeight jitter a mobile browser's toolbar emits
      // while scrolling — it would otherwise re-scale the rail (and shift its centre)
      // every time you change scroll direction. Width changes and big height changes
      // (orientation / real resize) still recompute. Desktop innerHeight is stable
      // during scroll, so it always recomputes — no width drift either way.
      if (
        !force &&
        coarse &&
        iw === lastViewport.current.w &&
        Math.abs(ih - lastViewport.current.h) < 150
      )
        return
      lastViewport.current = { w: iw, h: ih }
      setIsTouch(coarse)
      const sumInv = aspectsRef.current.reduce(
        (s, a) => s + 1 / (a || FALLBACK_ASPECT),
        0,
      )
      const gaps = (total - 1) * GAP
      // Base (max) rail width: a fixed reference scale on iPad, fluid on desktop.
      const base = coarse
        ? 44 // fixed iPad reference scale
        : Math.min(72, Math.max(44, 0.032 * iw)) // clamp(44,3.2vw,72)
      // Safe vertical band: 84px clear at top (≥ the 5rem header) + 84px at the bottom.
      const avail = ih - 168
      const naturalH = base * sumInv + gaps
      const w =
        naturalH > avail && sumInv > 0
          ? Math.max(MIN_W, (avail - gaps) / sumInv)
          : base
      setRailW(w)
      // Vertically centre the rail (floored at 84px so it clears the header). Desktop
      // AND touch use this sticky `top`: the rail flows aligned with the portfolio top,
      // pins centred while scrolling, then ends aligned with the portfolio bottom.
      const navH = w * sumInv + gaps
      setRailTop(Math.max(84, Math.round((ih - navH) / 2)))
      // Horizontally place the rail in the right gutter (portfolio right edge → screen
      // edge). Touch ALWAYS centres it there; desktop only slides left to centre once
      // the window narrows (clamped at 0 so wide screens keep the natural near-media
      // spot). The shift is a transform, so the portfolio never moves.
      const stack = mediaStackRef.current
      const row = stack?.parentElement
      if (stack && row) {
        const flexGap = parseFloat(getComputedStyle(row).columnGap) || 0
        const gutter = iw - stack.getBoundingClientRect().right
        const centred = Math.round((gutter - w) / 2 - flexGap)
        setRailShiftX(coarse ? centred : Math.min(0, centred))
      }
    }
    compute(true)
    const raf = requestAnimationFrame(() => compute(true)) // re-measure after settle
    const onResize = () => compute(false)
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
    }
  }, [total])

  // Jump to a thumbnail's media, CENTERED in the viewport (same alignment as the
  // snaps/scrub). A native `scrollIntoView` here fights Lenis's own smooth-scroll
  // and settles a little short, so clicking a far thumbnail used to land on the
  // previous item. On touch (coarse pointer) jump INSTANTLY: smooth-scrolling
  // through the big images is what iOS WebKit blanks to black, so we skip it.
  const scrollToItem = (i: number) => {
    const el = itemRefs.current[i]
    if (!el) return
    const r = el.getBoundingClientRect()
    const target =
      r.top + window.scrollY + r.height / 2 - window.innerHeight / 2
    const coarse =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(pointer: coarse)').matches
    if (lenis) lenis.scrollTo(target, { immediate: coarse })
    else el.scrollIntoView({ behavior: coarse ? 'auto' : 'smooth', block: 'start' })
  }

  if (total === 0) return null

  return (
    <div className="relative flex justify-center gap-[var(--space-2xl)]">
      {/* Invisible left spacer mirroring the navigator so the media stays centred.
          Matches the rail width per device (narrower on touch). */}
      {total > 1 && (
        <div
          aria-hidden
          className="hidden w-[clamp(44px,3.2vw,72px)] shrink-0 min-[960px]:block pointer-coarse:w-[32px]"
          style={!isTouch && railW != null ? { width: `${railW}px` } : undefined}
        />
      )}
      {/* Media stack — centred (capped width), the navigator sits to its right */}
      <div ref={mediaStackRef} className="relative flex w-full min-w-0 max-w-[1200px] flex-col">
        {(() => {
          const renderItem = (item: StackItem, i: number, half: boolean) => (
            <div
              key={item.key}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              data-idx={i}
              className={`relative ${half ? 'w-1/2' : 'w-full'} scroll-mt-[120px] overflow-hidden bg-bg-card ${half ? '' : radiusClass(i, total)}`}
            >
              {item.content}
            </div>
          )
          // Two consecutive 'half' items render side by side in a no-gap row;
          // everything else stays a full-width slide. Indices are preserved so the
          // navigator rail and scroll-spy keep working per item.
          const rows: React.ReactNode[] = []
          for (let i = 0; i < items.length; i++) {
            const item = items[i]
            const next = items[i + 1]
            if (item.half && next?.half) {
              rows.push(
                <div key={item.key} className="flex w-full items-start">
                  {renderItem(item, i, true)}
                  {renderItem(next, i + 1, true)}
                </div>,
              )
              i++
            } else {
              rows.push(renderItem(item, i, false))
            }
          }
          return rows
        })()}
      </div>

      {/* Thumbnail navigator. Wrapper is a full-viewport-height sticky box; on
          DESKTOP it top-aligns the rail at the header offset (unchanged look), on
          TOUCH (pointer-coarse) it centers the rail on the page. The rail is capped
          to the viewport height and its thumbnails shrink to fit, so even the
          biggest project (21 slides) stays fully visible on smaller screens —
          adaptive, not edge-to-edge. */}
      {total > 1 && (
        <div
          className="sticky top-[120px] hidden shrink-0 flex-col justify-start self-start min-[960px]:flex pointer-coarse:w-[32px]"
          style={railTop != null ? { top: `${railTop}px` } : undefined}
        >
        <nav
          ref={railRef}
          aria-label="Project media"
          onPointerDown={onRailPointerDown}
          onPointerMove={onRailPointerMove}
          onPointerUp={endRailGesture}
          onPointerCancel={endRailGesture}
          onClickCapture={onRailClickCapture}
          onDragStart={(e) => e.preventDefault()}
          style={{
            width: railW != null ? `${railW}px` : undefined,
            transform: railShiftX ? `translateX(${railShiftX}px)` : undefined,
          }}
          className="relative flex w-[clamp(44px,3.2vw,72px)] shrink-0 cursor-grab touch-pan-y select-none flex-col gap-[3px] active:cursor-grabbing pointer-coarse:w-[44px] [&_img]:pointer-events-none [&_img]:select-none"
        >
          {/* Position-indicator line — DESKTOP only. It's the "rail bar that gives
              position"; on touch we navigate by tapping slides, so it's removed. */}
          <span
            aria-hidden
            style={{ top: `${progress * 100}%` }}
            className="pointer-events-none absolute -left-[5px] -right-[5px] z-10 h-[3px] -translate-y-1/2 rounded-full bg-white/75 pointer-coarse:hidden"
          />
          {(() => {
            const renderRailBtn = (
              item: StackItem,
              i: number,
              half: boolean,
              isActive: boolean,
              side: 'left' | 'right' | null = null,
            ) => {
              // Full items hover-light on their own (`group`); paired halves share a
              // hover group on the row (`group/pair`) so hovering EITHER lights both.
              const dim = half
                ? 'opacity-30 group-hover/pair:opacity-70'
                : 'opacity-30 group-hover:opacity-70'
              // Round only the OUTER corners of a pair so the two halves read as one
              // joined thumbnail: left half rounds its left edge, right half its right
              // edge, the touching inner edges stay square. Full items round all four.
              const radius =
                side === 'left'
                  ? 'rounded-l-[3px]'
                  : side === 'right'
                    ? 'rounded-r-[3px]'
                    : 'rounded-[3px]'
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
                  style={{ aspectRatio: String(item.aspect) }}
                  className={`relative block overflow-hidden ${radius} ${half ? 'min-w-0 flex-1' : 'group w-full'}`}
                >
                  <span
                    className={`absolute inset-0 transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : dim
                    }`}
                  >
                    {item.thumbSource ? (
                      <Image
                        loader={sanityImageLoader}
                        src={urlFor(item.thumbSource).width(220).quality(70).url()}
                        alt=""
                        fill
                        draggable={false}
                        sizes="(pointer: coarse) 44px, 72px"
                        className="object-cover"
                      />
                    ) : item.posterUrl ? (
                      // Video cover (Vimeo poster) — external URL, so a plain bg image.
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${item.posterUrl})` }}
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
            }
            // Mirror the slide layout: two consecutive 'half' items become one rail
            // row with a left + right thumbnail (each still individually clickable).
            // Their scroll-snaps are already equal (same row in the stack), so the
            // active/progress/scrub math is unaffected.
            const rows: React.ReactNode[] = []
            for (let i = 0; i < items.length; i++) {
              const item = items[i]
              const next = items[i + 1]
              if (item.half && next?.half) {
                // Either half being active lights both; group/pair lights both on hover.
                const pairActive = active === i || active === i + 1
                // The two halves now sit flush (gap-0) so they read as one joined
                // thumbnail in the rail, matching the no-gap pair in the slide stack.
                // The row-level onClick is a harmless safety: `e.target ===
                // e.currentTarget` only fires if a click somehow lands on the row
                // itself rather than a button — both halves share one snap, so it
                // routes to this slide. Button clicks bubble with target = the
                // button, so the buttons keep owning their own clicks and the
                // drag-scrub's onClickCapture still suppresses post-drag.
                rows.push(
                  <div
                    key={item.key}
                    className="group/pair flex w-full cursor-pointer gap-0"
                    onClick={(e) => {
                      if (e.target === e.currentTarget) scrollToItem(i)
                    }}
                  >
                    {renderRailBtn(item, i, true, pairActive, 'left')}
                    {renderRailBtn(next, i + 1, true, pairActive, 'right')}
                  </div>,
                )
                i++
              } else {
                rows.push(renderRailBtn(item, i, false, active === i))
              }
            }
            return rows
          })()}
        </nav>
        </div>
      )}
    </div>
  )
}

