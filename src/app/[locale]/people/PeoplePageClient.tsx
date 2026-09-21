'use client'

import { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { urlFor } from '@/sanity/lib/image'
import { sanityImageLoader } from '@/sanity/lib/loader'
import { useLenis } from '@/components/LenisProvider'
import { CTAButton } from '@/components/MagneticButton'

interface TeamMember {
  _id: string
  name: string
  role?: string
  image?: {
    asset: { _ref: string }
  }
}

interface YearPhoto {
  _id: string
  image?: { asset: { _ref: string } }
  year?: string
  alt?: string
}

interface PeoplePageClientProps {
  members: TeamMember[]
  yearPhotos?: YearPhoto[]
}

/* One photo in the /people year-photo strip: either a Sanity image (managed in
   Studio under People → Year Photo) or a bundled static fallback. */
type StripPhoto = { image?: YearPhoto['image']; staticSrc?: string; alt: string }

/* ── Word-by-word reveal triggered by active state ── */
function BigStatement({ text, accent, active, className = '' }: {
  text: string; accent?: string; active: boolean; className?: string
}) {
  const words = text.split(' ')
  return (
    <div className={className}>
      <p className="font-display text-[clamp(1.8rem,4vw,3.5rem)] font-bold leading-[1.15]">
        {words.map((word, i) => (
          <motion.span
            key={i}
            className="mr-[0.3em] inline-block"
            initial={{ opacity: 0.15, y: 8 }}
            animate={active ? { opacity: 1, y: 0 } : { opacity: 0.15, y: 8 }}
            transition={{ duration: 0.5, delay: active ? i * 0.06 : 0, ease: [0.16, 1, 0.3, 1] }}
          >
            {word}
          </motion.span>
        ))}
        {accent && <span className="text-accent">{accent}</span>}
      </p>
    </div>
  )
}

/* ── Fade-up child triggered by active ── */
function FadeUp({ children, delay = 0, active, className = '' }: {
  children: React.ReactNode; delay?: number; active: boolean; className?: string
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={active ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, delay: active ? delay : 0, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}


/* ══════════════════════════════════════════════════════
   TOTAL SECTIONS = 6
══════════════════════════════════════════════════════ */
const TOTAL_SECTIONS = 6
const TRANSITION_DURATION = 700

/* Local team photos (preview only). Empty for now so the Faces grid uses
   Sanity members. To preview local headshots in /public/Team Photos/<name>.jpg,
   re-populate this array, e.g.:
   ['Megi Milo','Inxhi Fili','Brenton Ravolli','Briken Myzeqari','Darjana Haklaj',
    'Ermonela Ishmakaj','Ilda Hoxha','Isli Muça','Jursi Temali','Kostandin Feshti',
    'Rei Çollaku','Romina Uka'].map((name) => ({ name, localSrc: `/Team Photos/${name}.jpg` })) */
const LOCAL_TEAM: { name: string; localSrc: string }[] = []

const FOUNDERS_PHOTO: string = '/People - Photos/Old 2.png'

/* ── Auto-scrolling + draggable team-photo strip (b&w → color on hover) ── */
const PHOTOS = [1, 2, 3, 4, 5, 6, 7]
const PhotoMarquee = memo(function PhotoMarquee({ photos, className = '' }: { photos: StripPhoto[]; className?: string }) {
  // 4 copies = a long-enough ring; items are RECYCLED (head → tail) so the loop is
  // seamless regardless of the count.
  const repeated = [...photos, ...photos, ...photos, ...photos]
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  // `pos` = sub-pixel shift of the track, kept TINY (< one item's width) by recycling
  // the head item to the tail as it scrolls off. A tiny transform that never makes a
  // big jump means no once-per-loop repaint flash and no measurement to drift — the
  // earlier scrollLeft and big-modulo-jump versions both showed a hitch at the wrap.
  const pos = useRef(0)
  const drag = useRef({ active: false, pending: false, startX: 0, startY: 0, lastX: 0 })
  // Pause auto-advance briefly after a drag so it doesn't fight the gesture.
  const pauseUntil = useRef(0)
  const SPEED = 70 // px per second

  // Apply the transform, recycling items so `pos` stays within [0, headWidth).
  // Forward (pos grows): head scrolled fully off the left → move it to the tail.
  // Backward (pos < 0, from a right-drag): bring the tail back to the head.
  const apply = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    let p = pos.current
    let guard = 0
    while (guard++ < 64) {
      const first = track.firstElementChild as HTMLElement | null
      if (!first) break
      const w = first.getBoundingClientRect().width
      if (w > 0 && p >= w) {
        p -= w
        track.appendChild(first)
      } else break
    }
    while (guard++ < 64 && p < 0) {
      const last = track.lastElementChild as HTMLElement | null
      if (!last) break
      track.insertBefore(last, track.firstElementChild)
      p += last.getBoundingClientRect().width
    }
    pos.current = p
    track.style.transform = `translate3d(${-p}px, 0, 0)`
  }, [])

  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (!last) last = now
      const dt = (now - last) / 1000
      last = now
      if (!drag.current.active && now >= pauseUntil.current) {
        pos.current += SPEED * dt
        apply()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [apply])

  // Mouse drag via pointer events (mouse only). Incremental so it composes with the
  // recycling in apply().
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    drag.current = { active: true, pending: false, startX: e.clientX, startY: e.clientY, lastX: e.clientX }
    scrollerRef.current?.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !drag.current.active) return
    pos.current += drag.current.lastX - e.clientX
    drag.current.lastX = e.clientX
    apply()
    pauseUntil.current = performance.now() + 600
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (drag.current.active) {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId)
      pauseUntil.current = performance.now() + 600
    }
    drag.current.active = false
  }

  // Touch drag via NATIVE listeners so touchmove can be non-passive (preventDefault) —
  // the reliable way to drive a horizontal drag inside a vertical scroller on iOS
  // (React pointer events alone didn't move the strip on iPad). Horizontal → drag
  // (preventDefault); vertical → bail so the slide deck / page still scroll. Mobile is
  // safe: we only ever preventDefault once a clearly-horizontal drag has started.
  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      drag.current = { active: false, pending: true, startX: t.clientX, startY: t.clientY, lastX: t.clientX }
    }
    const onMove = (e: TouchEvent) => {
      const d = drag.current
      const t = e.touches[0]
      if (!t) return
      if (d.active) {
        e.preventDefault()
        pos.current += d.lastX - t.clientX
        d.lastX = t.clientX
        apply()
        pauseUntil.current = performance.now() + 600
        return
      }
      if (!d.pending) return
      const dx = t.clientX - d.startX
      const dy = t.clientY - d.startY
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        d.active = true
        d.lastX = t.clientX
        e.preventDefault()
      } else if (Math.abs(dy) > 6) {
        d.pending = false
      }
    }
    const onEnd = () => {
      drag.current.active = false
      drag.current.pending = false
      pauseUntil.current = performance.now() + 600
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [apply])

  if (photos.length === 0) return null

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
      className={`relative min-h-0 w-full flex-1 cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing ${className}`}
    >
      <div ref={trackRef} className="flex h-full w-max will-change-transform">
        {repeated.map((p, i) => (
          <div key={i} className="group relative h-full aspect-[1286/1500] shrink-0">
            <Image
              {...(p.image
                ? { loader: sanityImageLoader, src: urlFor(p.image).width(700).url() }
                : { src: p.staticSrc as string })}
              alt={p.alt}
              fill
              // The band is height-driven, so its real width is ~21–26vw on
              // typical screens; 34vw over-fetched on wide monitors. Cap the
              // wide-screen branch to ~560px (still ≥ the real display) so the
              // 28 looping copies don't pile up decoded memory on iOS Safari.
              sizes="(max-width: 768px) 70vw, (min-width: 1600px) 560px, 34vw"
              draggable={false}
              priority={i < 5}
              className="pointer-events-none object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </div>
  )
})

type FaceItem = {
  id: string
  name: string
  role?: string
  image?: TeamMember['image']
  localSrc?: string
}

/* ── Faces gallery — two rows, looping auto-scroll + drag (item-recycling) ── */
const FacesGallery = memo(function FacesGallery({ team }: { team: FaceItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  // `pos` = tiny sub-pixel shift; columns are RECYCLED (head → tail) so it never makes
  // a big jump. Driven by a CSS transform, not scrollLeft (which Safari rounds to ints
  // → the once-per-loop hitch). Recycling a WHOLE column (rows items) at a time keeps
  // the column-major 2-row grid aligned through the loop — moving single items would
  // swap rows and "switch the starting position".
  const pos = useRef(0)
  const drag = useRef({ active: false, pending: false, startX: 0, startY: 0, lastX: 0 })
  const pauseUntil = useRef(0)
  const SPEED = 40 // px per second
  const repeated = team.length ? [...team, ...team, ...team, ...team] : []

  const rowsNow = () =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches ? 2 : 1

  // Recycle so `pos` stays within [0, columnStride): head column off the left → move
  // its `rows` items to the tail; backward (right-drag) → bring the tail column up.
  const apply = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const rows = rowsNow()
    const stride = () => {
      const kids = track.children
      if (kids.length <= rows) return 0
      return (
        (kids[rows] as HTMLElement).getBoundingClientRect().left -
        (kids[0] as HTMLElement).getBoundingClientRect().left
      )
    }
    let p = pos.current
    let guard = 0
    while (guard++ < 200) {
      const s = stride()
      if (s > 0 && p >= s) {
        p -= s
        for (let k = 0; k < rows; k++) track.appendChild(track.firstElementChild as HTMLElement)
      } else break
    }
    while (guard++ < 200 && p < 0) {
      const s = stride()
      if (s <= 0) break
      for (let k = 0; k < rows; k++) track.insertBefore(track.lastElementChild as HTMLElement, track.firstElementChild)
      p += s
    }
    pos.current = p
    track.style.transform = `translate3d(${-p}px, 0, 0)`
  }, [])

  useEffect(() => {
    if (!team.length) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (!last) last = now
      const dt = (now - last) / 1000
      last = now
      if (!drag.current.active && now >= pauseUntil.current) {
        pos.current += SPEED * dt
        apply()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [apply, team.length])

  // Mouse drag via pointer events (mouse only).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    drag.current = { active: true, pending: false, startX: e.clientX, startY: e.clientY, lastX: e.clientX }
    scrollerRef.current?.setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || !drag.current.active) return
    pos.current += drag.current.lastX - e.clientX
    drag.current.lastX = e.clientX
    apply()
    pauseUntil.current = performance.now() + 600
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    if (drag.current.active) {
      scrollerRef.current?.releasePointerCapture?.(e.pointerId)
      pauseUntil.current = performance.now() + 600
    }
    drag.current.active = false
  }

  // Touch drag via NATIVE listeners (non-passive touchmove) — reliable on iOS, where
  // React pointer events didn't move the strip. Horizontal → drag (preventDefault);
  // vertical → bail so the slide deck / page still scroll (mobile safe).
  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !team.length) return
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      if (!t) return
      drag.current = { active: false, pending: true, startX: t.clientX, startY: t.clientY, lastX: t.clientX }
    }
    const onMove = (e: TouchEvent) => {
      const d = drag.current
      const t = e.touches[0]
      if (!t) return
      if (d.active) {
        e.preventDefault()
        pos.current += d.lastX - t.clientX
        d.lastX = t.clientX
        apply()
        pauseUntil.current = performance.now() + 600
        return
      }
      if (!d.pending) return
      const dx = t.clientX - d.startX
      const dy = t.clientY - d.startY
      if (Math.abs(dx) > 6 && Math.abs(dx) >= Math.abs(dy)) {
        d.active = true
        d.lastX = t.clientX
        e.preventDefault()
      } else if (Math.abs(dy) > 6) {
        d.pending = false
      }
    }
    const onEnd = () => {
      drag.current.active = false
      drag.current.pending = false
      pauseUntil.current = performance.now() + 600
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [apply, team.length])

  if (!team.length) {
    return <p className="py-20 text-center text-text-tertiary">Team members coming soon.</p>
  }

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragStart={(e) => e.preventDefault()}
      className="w-full cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
    >
      {/* Single row on mobile (larger images, no nested vertical scroll); two rows on desktop */}
      <div ref={trackRef} className="grid w-max grid-flow-col grid-rows-1 gap-[0.625rem] will-change-transform md:grid-rows-2 md:gap-3">
        {repeated.map((member, i) => (
          <div
            key={i}
            className="group relative aspect-[5/7] w-[clamp(116px,32vw,150px)] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-bg-card md:w-[clamp(150px,16vw,220px)]"
          >
            {member.image?.asset ? (
              <Image
                loader={sanityImageLoader}
                src={urlFor(member.image).width(450).url()}
                alt={member.name}
                fill
                draggable={false}
                loading="lazy"
                className="pointer-events-none object-cover"
                // Bound the fetched/decoded size to the real card width (≤150px
                // mobile, ≤220px desktop). The old 16vw + width(600) over-fetched
                // 3–4× on large screens; across 4 looping copies that decoded
                // memory is what tips iOS Safari into blanking scroll tiles.
                sizes="(max-width: 768px) 150px, 220px"
              />
            ) : member.localSrc ? (
              <Image
                src={member.localSrc}
                alt={member.name}
                fill
                draggable={false}
                loading="lazy"
                className="pointer-events-none object-cover"
                sizes="(max-width: 768px) 150px, 220px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-12 w-12 rounded-full border-2 border-text-tertiary" />
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-end p-[var(--space-sm)] opacity-0 transition-opacity duration-[0.4s] group-hover:opacity-100 [@media(hover:none)]:opacity-100"
              style={{
                background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.8) 100%)',
                transitionTimingFunction: 'var(--ease-out-expo)',
              }}
            >
              <h3
                className="translate-y-2 font-display text-[0.95rem] font-semibold leading-tight transition-transform duration-[0.4s] group-hover:translate-y-0 [@media(hover:none)]:translate-y-0"
                style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
              >
                {member.name}
              </h3>
              {member.role && (
                <span
                  className="mt-0.5 translate-y-2 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary transition-transform duration-[0.4s] group-hover:translate-y-0 [@media(hover:none)]:translate-y-0"
                  style={{ transitionTimingFunction: 'var(--ease-out-expo)', transitionDelay: '0.04s' }}
                >
                  {member.role}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

export default function PeoplePageClient({
  members,
  yearPhotos = [],
}: PeoplePageClientProps) {
  // Year-photo strip: managed Sanity photos (People → Year Photo) if any, else
  // the bundled static set so the strip is never empty.
  const stripPhotos: StripPhoto[] = useMemo(
    () =>
      yearPhotos.filter((p) => p.image?.asset?._ref).length
        ? yearPhotos
            .filter((p) => p.image?.asset?._ref)
            .map((p) => ({ image: p.image, alt: p.alt || 'BoldCrest team' }))
        : PHOTOS.map((n) => ({
            staticSrc: `/People - Photos/${n}.jpg`,
            alt: `BoldCrest team ${n}`,
          })),
    [yearPhotos],
  )
  const [current, setCurrent] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Landscape phones are ≥768px wide (so NOT isMobile) but only ~390px tall — the
  // wheel/touch-jacked deck can't show a slide's worth of copy in that height, and
  // Lenis (active because !isMobile) is STOPPED per-slide, which blocks the slides'
  // native scroll → content clips with no way to reach it. So in landscape-short we
  // switch the whole page OFF the deck and into a normal vertical scroll: the
  // wrapper stops translating, sections grow to their content, body scroll is never
  // locked, and the deck handlers bail. isLandscapeShort is never isMobile, so
  // portrait and desktop behaviour is byte-for-byte unchanged.
  const [isLandscapeShort, setIsLandscapeShort] = useState(false)
  // Any touch-capable device (phone AND iPad) — the deck locks scroll on all of
  // them, so the custom pull-to-refresh must run on all of them, not just <768px.
  const [isTouch, setIsTouch] = useState(false)
  // Custom pull-to-refresh (touch devices, first slide only) — see the PTR effect.
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const pullAmt = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchStartX = useRef(0)
  // Scroll state of the active slide captured at touchstart (mobile): used to
  // decide whether a swipe scrolls the slide internally or advances the deck.
  const touchStartEdges = useRef({ atTop: true, atBottom: true, scrollable: false })
  // False right after we land on the last slide; true once the snap settles and
  // page-scroll to the footer is allowed (absorbs hard-scroll momentum).
  const lastSlideReady = useRef(false)
  // Wheel-stepping state (refs survive handler re-creation): accumulated intent
  // within one continuous gesture + its last timestamp (so a gentle swipe of
  // tiny deltas still advances), and a "swallow until" deadline (an event
  // timestamp) so one hard flick advances exactly one slide. A deadline (not a
  // timer) can't be orphaned by a React re-render, so it always lapses on its own.
  const wheelAccum = useRef(0)
  const lastWheelTs = useRef(0)
  const swallowUntil = useRef(0)
  const lenis = useLenis()

  // On mobile the full-screen slide deck can't hold tall content, so we fall
  // back to a normal scrolling page (sections grow + stack). Desktop keeps the
  // wheel-jacked deck.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    // Coarse pointer OR touch events present → includes iPad (which is ≥768 so
    // it isn't "mobile", yet is still touch-driven and scroll-locked here).
    setIsTouch('ontouchstart' in window || window.matchMedia('(any-pointer: coarse)').matches)
    mq.addEventListener('change', update)
    const lsMq = window.matchMedia('(orientation: landscape) and (max-height: 480px)')
    const updateLs = () => setIsLandscapeShort(lsMq.matches)
    updateLs()
    lsMq.addEventListener('change', updateLs)
    return () => {
      mq.removeEventListener('change', update)
      lsMq.removeEventListener('change', updateLs)
    }
  }, [])

  // Drive Lenis per slide. While navigating the deck it must be PAUSED (its
  // wheel handler would otherwise scroll the page out from under the slides).
  // On the LAST slide it must be ACTIVE so it can smooth-scroll down to the
  // footer — note a *stopped* Lenis still preventDefaults wheel, which would
  // block native scroll, so we genuinely re-start it here (and resize() so its
  // scroll limit includes the footer). Mobile has no Lenis and uses the
  // html/body overflow lock below instead.
  useEffect(() => {
    if (!lenis) return
    // Landscape-short is a normal scroll page — Lenis must stay ACTIVE the whole
    // time (a stopped Lenis preventDefaults wheel and blocks native scrolling).
    if (isLandscapeShort) {
      lenis.resize()
      lenis.start()
      return
    }
    const last = TOTAL_SECTIONS - 1
    if (current === last) {
      // Snap onto the last slide first: keep Lenis STOPPED for a beat after we
      // arrive so the wheel momentum from a hard scroll (which is what brought
      // us here) gets absorbed instead of flinging straight past the slide into
      // the footer. A stopped Lenis keeps preventing the wheel, so the deck
      // holds on this slide; once the burst settles we start Lenis and the user
      // can smoothly scroll down to the footer.
      const t = setTimeout(() => {
        lenis.resize()
        lenis.start()
      }, TRANSITION_DURATION + 250)
      return () => clearTimeout(t)
    }
    lenis.stop()
  }, [lenis, current, isLandscapeShort])

  // Gate page-scroll on the last slide independently of Lenis: hold for a beat
  // after arriving so leftover hard-scroll momentum is absorbed (the deck snaps
  // onto the slide), then allow the smooth scroll down to the footer.
  useEffect(() => {
    const last = TOTAL_SECTIONS - 1
    if (current !== last) {
      lastSlideReady.current = false
      return
    }
    lastSlideReady.current = false
    const t = setTimeout(() => { lastSlideReady.current = true }, TRANSITION_DURATION + 250)
    return () => clearTimeout(t)
  }, [current])

  // Restore Lenis when leaving the page (in case we exit on a paused slide).
  useEffect(() => {
    return () => { lenis?.start() }
  }, [lenis])

  const goTo = useCallback((index: number) => {
    if (isLocked) return
    const clamped = Math.max(0, Math.min(TOTAL_SECTIONS - 1, index))
    if (clamped === current) return
    setIsLocked(true)
    setCurrent(clamped)
    setTimeout(() => setIsLocked(false), TRANSITION_DURATION + 100)
  }, [current, isLocked])

  // Wheel handler. Gated on TOUCH, not width: it runs for any non-touch pointer
  // (mouse/trackpad) — INCLUDING a desktop window squeezed below 768px, which
  // renders the "mobile" stack but has no touch to drive it. Touch devices
  // (phone/iPad) skip this and use the touch handler instead.
  useEffect(() => {
    const el = containerRef.current
    // Landscape-short is a normal scroll page — no wheel-jacking.
    if (!el || isTouch || isLandscapeShort) return

    const onWheel = (e: WheelEvent) => {
      const last = TOTAL_SECTIONS - 1
      // On the final slide, let the page scroll normally so the footer shows.
      // Only re-capture the wheel to step back up when the deck is at the top.
      if (current === last) {
        // Scroll up while the deck is at the top steps back into the deck.
        if (e.deltaY < 0 && window.scrollY <= 0) {
          e.preventDefault()
          if (!isLocked) goTo(current - 1)
          return
        }
        // Snap onto the slide first: until the snap settles, absorb downward
        // wheel so a hard scroll's leftover momentum can't fling past this slide
        // into the footer. Once settled, let Lenis scroll down to the footer.
        if (e.deltaY > 0 && !lastSlideReady.current) {
          e.preventDefault()
        }
        return
      }

      // In the narrow ("mobile") layout a slide can be taller than the viewport
      // and scroll internally (overflow-y-auto). Mirror the touch rule: let the
      // wheel scroll the slide first, and only advance the deck once the slide is
      // at the matching edge. (Wide desktop slides are overflow-hidden, so this is
      // gated on isMobile and the deck keeps stepping per scroll there.)
      if (isMobile) {
        const slide = wrapperRef.current?.children[current] as HTMLElement | undefined
        if (slide && slide.scrollHeight > slide.clientHeight + 4) {
          const atTop = slide.scrollTop <= 2
          const atBottom =
            slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 2
          if ((e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)) return
        }
      }

      e.preventDefault()

      // Absorb the trackpad inertia that trails a step so one hard flick
      // advances exactly one slide (leftover momentum can't double-step). Fixed
      // window from the snap (a deadline, so it always lapses on its own — it
      // can never block the next real scroll).
      if (e.timeStamp < swallowUntil.current) return
      if (isLocked) return

      // Normalise across delta modes so a mouse notch and a trackpad swipe are
      // comparable, then accumulate intent WITHIN one continuous gesture (reset
      // on a pause or a direction change) so even a gentle swipe — whose
      // individual deltas are tiny — reliably crosses the threshold instead of
      // being ignored (the old "needs a second scroll").
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? el.clientHeight : 1
      const dy = e.deltaY * unit
      if (e.timeStamp - lastWheelTs.current > 200 || Math.sign(dy) !== Math.sign(wheelAccum.current)) {
        wheelAccum.current = 0
      }
      lastWheelTs.current = e.timeStamp
      wheelAccum.current += dy
      if (Math.abs(wheelAccum.current) < 28) return
      const dir = wheelAccum.current > 0 ? 1 : -1
      wheelAccum.current = 0
      // Fixed window from the snap. Middle ground (1150ms): long enough to absorb
      // most of a hard flick's momentum tail (fewer skips) but a FIXED, predictable
      // wait — not "absorb until all momentum dies", which felt too slow to re-step.
      // EXCEPTION — the founders slide ("The Equation", index 2) must never be
      // flicked past: absorb the inertia tail much longer when LANDING on it (either
      // direction) so it is always a resting stop. Every other slide keeps the fast
      // re-step. This is still a deadline (it lapses on its own), so a fresh,
      // deliberate scroll always advances off it — no input is ever blocked, and
      // touch/trackpad scrolling itself is unchanged.
      const dest = current + dir
      swallowUntil.current = e.timeStamp + TRANSITION_DURATION + (dest === 2 ? 1100 : 450)
      goTo(dest)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [current, isLocked, goTo, isMobile, isTouch, isLandscapeShort])

  // Touch handler — drives the deck on both touch-laptops and mobile. On
  // mobile a slide taller than the viewport scrolls internally first; the deck
  // only advances once the swipe starts from the relevant scroll edge.
  useEffect(() => {
    const el = containerRef.current
    // Landscape-short is a normal scroll page — let native touch scroll run.
    if (!el || isLandscapeShort) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
      touchStartX.current = e.touches[0].clientX
      const slide = wrapperRef.current?.children[current] as HTMLElement | undefined
      if (slide) {
        const scrollable = slide.scrollHeight > slide.clientHeight + 4
        touchStartEdges.current = {
          scrollable,
          atTop: slide.scrollTop <= 2,
          atBottom: slide.scrollTop + slide.clientHeight >= slide.scrollHeight - 2,
        }
      } else {
        touchStartEdges.current = { scrollable: false, atTop: true, atBottom: true }
      }
    }
    const onTouchEnd = (e: TouchEvent) => {
      const last = TOTAL_SECTIONS - 1
      const diff = touchStartY.current - e.changedTouches[0].clientY
      const diffX = touchStartX.current - e.changedTouches[0].clientX
      // Ignore predominantly-horizontal swipes: those belong to the staff/faces
      // carousels (overflow-x strips). Without this, a sideways flick with a bit
      // of vertical drift was read as a deck swipe and jumped to the previous
      // slide. Only a clearly-vertical swipe drives the deck.
      if (Math.abs(diffX) > Math.abs(diff)) return
      const { scrollable, atTop, atBottom } = touchStartEdges.current
      // On the final slide, allow native scroll to the footer; only step back
      // into the deck on a downward swipe when the page is at the top.
      if (current === last) {
        if (diff < 0 && window.scrollY <= 0 && atTop && !isLocked && Math.abs(diff) > 50) {
          goTo(current - 1)
        }
        return
      }
      if (isLocked) return
      if (Math.abs(diff) < 50) return
      // When the slide can scroll internally, only advance from its edges so
      // mid-content swipes just scroll the slide (mobile only).
      if (isMobile && scrollable) {
        if (diff > 0 && atBottom) goTo(current + 1)
        else if (diff < 0 && atTop) goTo(current - 1)
        return
      }
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [current, isLocked, goTo, isMobile, isLandscapeShort])

  // ── Custom pull-to-refresh (mobile, first slide only) ──────────────────────
  // Native PTR can't fire on this page: the deck locks document scroll
  // (overflow:hidden) and unlocking would let the page scroll to the footer and
  // break the deck. So we mimic it — a downward drag from the top of slide 0
  // reveals a spinner and reloads past a threshold. A downward swipe on slide 0
  // otherwise does nothing (no previous slide), so this reuses an idle gesture.
  useEffect(() => {
    if (!isTouch || current !== 0 || isLandscapeShort) return
    const el = containerRef.current
    if (!el) return
    const THRESHOLD = 56
    let startY = 0
    let startX = 0
    let mode: 'idle' | 'pull' | 'reject' = 'idle'

    const atTop = () => {
      const slide = wrapperRef.current?.children[0] as HTMLElement | undefined
      return !slide || slide.scrollTop <= 2
    }
    const onStart = (e: TouchEvent) => {
      mode = atTop() ? 'idle' : 'reject'
      startY = e.touches[0].clientY
      startX = e.touches[0].clientX
    }
    const onMove = (e: TouchEvent) => {
      if (mode === 'reject') return
      const dy = e.touches[0].clientY - startY
      const dx = e.touches[0].clientX - startX
      if (mode === 'idle') {
        // Decide intent on the first real movement: horizontal → let the face
        // carousels scroll; upward → let the deck advance; only a downward drag
        // from the top becomes a pull-to-refresh.
        if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { mode = 'reject'; return }
        if (dy > 8) mode = 'pull'
        else if (dy < -8) { mode = 'reject'; return }
        else return
      }
      if (!atTop()) { mode = 'reject'; setPull(0); return }
      if (dy <= 0) { setPull(0); return }
      e.preventDefault() // take over from the slide's native rubber-band
      const p = dy * 0.5 // resistance
      pullAmt.current = p
      setPull(p)
    }
    const onEnd = () => {
      if (mode === 'pull') {
        if (pullAmt.current >= THRESHOLD) {
          setRefreshing(true)
          setPull(THRESHOLD)
          window.setTimeout(() => window.location.reload(), 500)
        } else {
          setPull(0)
        }
      }
      pullAmt.current = 0
      mode = 'idle'
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    }
  }, [isTouch, current, isLandscapeShort])

  // Keyboard handler
  useEffect(() => {
    if (isMobile || isLandscapeShort) return
    const onKey = (e: KeyboardEvent) => {
      const last = TOTAL_SECTIONS - 1
      // On the final slide, leave the keys to native scrolling (footer) — except
      // ArrowUp at the very top, which steps back into the deck.
      if (current === last) {
        if (e.key === 'ArrowUp' && window.scrollY <= 0) { e.preventDefault(); goTo(current - 1) }
        return
      }
      if (e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); goTo(current + 1) }
      if (e.key === 'ArrowUp') { e.preventDefault(); goTo(current - 1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [current, goTo, isMobile, isLandscapeShort])

  // Lock page scroll while navigating slides; release on the last slide so the
  // footer below the deck can be reached with a normal scroll. Lock the <html>
  // element too — body-only is not enough now that the document is taller than
  // the viewport (the footer sits below the in-flow deck). On mobile the deck is
  // disabled, so the page must scroll freely — never lock.
  useEffect(() => {
    const html = document.documentElement
    // Landscape-short is a normal scroll page — never lock the document.
    if (isLandscapeShort) {
      html.style.overflow = ''
      document.body.style.overflow = ''
      return
    }
    const last = TOTAL_SECTIONS - 1
    if (current === last) {
      html.style.overflow = ''
      document.body.style.overflow = ''
    } else {
      html.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
      window.scrollTo(0, 0)
    }
    return () => {
      html.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [current, isMobile, isLandscapeShort])

  // Footer "back to top" resets the deck to the first slide. Setting current to
  // 0 also triggers the body-lock effect above, which scrolls the document up.
  useEffect(() => {
    const handler = () => setCurrent(0)
    window.addEventListener('boldcrest:back-to-top', handler)
    return () => window.removeEventListener('boldcrest:back-to-top', handler)
  }, [])

  // On the deck only the current slide is "active" (its copy animates in). On the
  // landscape-short scroll page every section is on-screen as you scroll, so all
  // are active — otherwise the off-current sections would sit dimmed/hidden.
  const active = (i: number) => isLandscapeShort || current === i

  // Faces grid — local preview photos for now; Sanity members take over
  // once optimized images are uploaded (empty LOCAL_TEAM to switch back).
  // Memoised so the array reference is stable across the deck's re-renders — the
  // memoised FacesGallery recycles its DOM nodes, which a fresh `team` ref would undo.
  const team = useMemo(
    () =>
      LOCAL_TEAM.length > 0
        ? LOCAL_TEAM.map((m) => ({
            id: m.name,
            name: m.name,
            role: undefined as string | undefined,
            image: undefined as TeamMember['image'],
            localSrc: m.localSrc,
          }))
        : members.map((m) => ({
            id: m._id,
            name: m.name,
            role: m.role as string | undefined,
            image: m.image,
            localSrc: undefined as string | undefined,
          })),
    [members],
  )

  return (
    <>
    <div
      ref={containerRef}
      className={
        isLandscapeShort
          ? 'relative bg-bg' // normal scroll page: auto height, no overflow lock
          : isMobile
            ? 'relative h-[100svh] overflow-hidden bg-bg'
            : 'relative h-[100dvh] overflow-hidden bg-bg'
      }
    >
      {/* Pull-to-refresh spinner — sibling of the translated wrapper so it stays
          fixed to the viewport top while the deck slides. Hidden above the top
          edge at rest; follows the finger down, then spins + reloads. */}
      {isTouch && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-3 z-[55]"
          style={{
            transform: `translate(-50%, ${Math.min(pull, 90) - 48}px)`,
            opacity: refreshing ? 1 : Math.min(1, pull / 56),
            transition: pull === 0 ? 'transform 0.3s ease, opacity 0.3s ease' : 'none',
          }}
        >
          {/* Thin ring with a single bright arc — reads like the native iOS/Chrome
              refresh spinner (no opaque pill). Winds up as you pull, spins on release. */}
          <div
            className={`h-7 w-7 rounded-full border-2 border-white/25 ${refreshing ? 'animate-spin' : ''}`}
            style={{
              borderTopColor: '#ffffff',
              transform: refreshing ? undefined : `rotate(${pull * 4}deg)`,
            }}
          />
        </div>
      )}

      {/* Sliding wrapper — deck translates one slide at a time on both desktop
          and mobile (mobile uses svh + touch input; tall slides scroll
          internally before advancing). */}
      <motion.div
        ref={wrapperRef}
        className="relative will-change-transform"
        animate={{ y: isLandscapeShort ? 0 : `${-current * 100}${isMobile ? 'svh' : 'dvh'}` }}
        transition={{ duration: TRANSITION_DURATION / 1000, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* ═══════════════════════════════════════════
            0. HERO
        ═══════════════════════════════════════════ */}
        <section className="relative flex h-[100svh] flex-col overflow-x-hidden overflow-y-auto bg-bg md:h-[100dvh] md:overflow-hidden landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:pb-14">
          {/* Hero copy — full-width stretch, top-aligned to match Work/Services/Diary */}
          <div className="shrink-0 px-[var(--gutter)] pt-[120px] [@media(max-height:780px)]:pt-[92px]">
            <div className="w-full">
              <motion.p
                className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                People
              </motion.p>

              <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                {/* Left — headline + established */}
                <div>
                  <motion.h1
                    className="font-display text-[clamp(2.25rem,min(6vw,8.5vh),5rem)] font-bold leading-[1.06]"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    Two earthquakes<span className="text-accent">,</span>{' '}
                    <br className="hidden md:block" />
                    a pandemic<span className="text-accent">,</span> and{' '}
                    <br className="hidden md:block" />
                    a decision<span className="text-accent">.</span>
                  </motion.h1>

                  <motion.p
                    className="mt-[var(--space-lg)] text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Est. 2019, Tirana, Albania
                  </motion.p>
                </div>

                {/* Right — story copy, right-aligned. Narrower on iPad so the
                    right-aligned lines don't get ragged; bottom-aligns with the
                    headline via md:items-end on the parent. */}
                <motion.div
                  className="max-w-[440px] md:max-w-[320px] md:text-right lg:max-w-[420px]"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-[0.95rem] leading-[1.7] text-text-secondary">
                    The ground shook twice. The world shut down. And somewhere in the middle of all of that, two 22-year-olds decided it was a good time to build an agency.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Gap between the copy and the photo band, sized to MATCH the nav-logo →
              "People" label gap (logo bottom ≈57px, label top = the copy's pt → 63px
              gap; pt drops to 92px on short screens → 35px gap). The band below is
              flex-1, so on the deck it fills ALL remaining height down to the bottom
              edge — no void/black bar. */}
          <div aria-hidden className="h-[63px] shrink-0 [@media(max-height:780px)]:h-[35px] landscape-short:h-6!" />

          {/* Photo band — auto-scrolling, draggable, b&w → color on hover (5 shown).
              On the landscape-short SCROLL page there's no fixed-height parent to
              flex into, so flex-1 would collapse to nothing; give it an explicit,
              generous height there (NOT the cramped micro-strip) via flex-none. */}
          <PhotoMarquee
            photos={stripPhotos}
            className="landscape-short:flex-none! landscape-short:h-[220px]!"
          />
        </section>

        {/* ═══════════════════════════════════════════
            1. THE MOTTO
        ═══════════════════════════════════════════ */}
        <section className="grid grid-cols-1 [align-content:safe_center] h-[100svh] overflow-x-hidden overflow-y-auto px-[var(--gutter)] md:flex md:h-[100dvh] md:items-center md:overflow-hidden landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:items-start! landscape-short:py-14">
          <div className="mx-auto w-full max-w-[var(--max-width)] text-center">
            <FadeUp active={active(1)}>
              <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                Our motto
              </p>
            </FadeUp>

            <BigStatement text="Climbing Mountains Together." active={active(1)} className="text-center" />

            <div className="mx-auto mt-[var(--space-xl)] flex max-w-[640px] flex-col gap-[var(--space-md)]">
              <FadeUp delay={0.1} active={active(1)}>
                <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                  It means we do not stand at the bottom and point to the peak. We climb with you. We enter the work fully. The meetings, the pressure, the decisions, the parts no one sees. We learn how your business moves before we decide how your brand should move.
                </p>
              </FadeUp>

              <FadeUp delay={0.15} active={active(1)}>
                <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                  We do not disappear after the delivery. We stay close, challenge what needs to be challenged, and take responsibility for the path we recommend. Because real partnership is not agreement at every step. It is trust, honesty, endurance, and the will to reach the top together.
                </p>
              </FadeUp>
            </div>

            <FadeUp delay={0.25} active={active(1)}>
              {/* Mobile size scales with the viewport so the longer first line
                  ("We've been told we're too involved.") stays on ONE row down to
                  small phones; the shorter second line then matches automatically
                  (same <p>). Desktop unchanged via md:. */}
              <p className="mx-auto mt-[var(--space-2xl)] max-w-[900px] font-display text-[clamp(0.9rem,4.6vw,1.4rem)] font-bold leading-[1.25] tracking-[-0.01em] text-text-primary md:text-[clamp(1.4rem,2.8vw,2.4rem)]">
                &ldquo;We&apos;ve been told we&apos;re too involved.&rdquo;
                <br />
                <span className="text-text-tertiary">We consider that a compliment.</span>
              </p>
            </FadeUp>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            2. THE FOUNDERS
        ═══════════════════════════════════════════ */}
        <section className="grid grid-cols-1 [align-content:safe_center] h-[100svh] overflow-x-hidden overflow-y-auto px-[var(--gutter)] md:flex md:h-[100dvh] md:items-center md:overflow-hidden landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:items-start! landscape-short:py-14">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <div className="grid gap-[var(--space-md)] md:grid-cols-[1fr_1fr] md:items-center md:gap-[var(--space-xl)]">
              <FadeUp active={active(2)}>
                <div className="group relative mx-auto w-[52vw] max-w-[210px] rotate-[-10deg] md:mx-0 md:w-[85%] md:max-w-none">
                  {FOUNDERS_PHOTO ? (
                    <Image
                      src={FOUNDERS_PHOTO}
                      alt="Xhulio and Aldo, founders of BoldCrest"
                      width={1228}
                      height={1500}
                      unoptimized
                      sizes="(max-width: 768px) 58vw, 42vw"
                      className="h-auto w-full object-contain transition-transform duration-[0.8s] group-hover:scale-[1.03] md:max-h-[62dvh]"
                      style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
                    />
                  ) : (
                    <div className="flex aspect-[4/5] w-full items-center justify-center rounded-[var(--radius-lg)] bg-bg-elevated">
                      <p className="font-display text-[4rem] font-bold leading-none text-text-tertiary" style={{ opacity: 0.15 }}>
                        X + A
                      </p>
                    </div>
                  )}
                </div>
              </FadeUp>

              <div className="flex flex-col gap-[var(--space-sm)] md:gap-[var(--space-md)]">
                <FadeUp active={active(2)}>
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                    The equation
                  </p>
                </FadeUp>

                <FadeUp delay={0.1} active={active(2)}>
                  <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                    BoldCrest began where two different strengths met. Xhulio brought the visual discipline, the instinct for form, and the ability to turn ideas into images with character. Aldo brought the relationships, the conversations, and the trust needed to turn one project into a long-term partnership.
                  </p>
                </FadeUp>

                <FadeUp delay={0.15} active={active(2)}>
                  <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                    The equation was simple, but powerful. Creative vision on one side. Business understanding on the other. Together, they became the foundation for what BoldCrest would grow into. We were 22, building our first team from the same university halls we were still walking through, driven by clear instinct, strong work ethic, and the belief that the market was ready for something sharper.
                  </p>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            3. TEAM CULTURE + FACES (combined)
        ═══════════════════════════════════════════ */}
        <section className="grid grid-cols-1 [align-content:safe_center] h-[100svh] overflow-x-hidden overflow-y-auto px-[var(--gutter)] pt-[80px] md:flex md:h-[100dvh] md:items-center md:overflow-hidden md:pt-0 landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:items-start! landscape-short:py-14">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <div className="grid items-center gap-[var(--space-lg)] md:grid-cols-2 md:gap-[var(--space-2xl)]">
              {/* Left — culture copy */}
              <div className="min-w-0">
                <FadeUp active={active(3)}>
                  <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                    The team
                  </p>
                </FadeUp>

                <BigStatement text="Every person has a glitch in their system." active={active(3)} />

                <FadeUp delay={0.1} active={active(3)}>
                  <p className="mt-[var(--space-lg)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                    Something slightly off, slightly unusual, slightly theirs. And that&apos;s exactly what makes them belong here. We are different people who are somehow made of the same thing.
                  </p>
                </FadeUp>

                <FadeUp delay={0.15} active={active(3)}>
                  <p className="mt-[var(--space-md)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                    We bully each other. We cook together. We have traditions that make no sense to anyone outside this room. And when someone is sick, we show up.
                  </p>
                </FadeUp>

                <FadeUp delay={0.2} active={active(3)}>
                  <p className="mt-[var(--space-md)] text-[1.05rem] font-semibold leading-[1.7] text-text-primary">
                    It is, honestly, harder to find someone who won&apos;t disturb our peace than someone who has a great portfolio.
                  </p>
                </FadeUp>
              </div>

              {/* Right — sliding faces gallery */}
              <FadeUp delay={0.2} active={active(3)} className="min-w-0">
                <FacesGallery team={team} />
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            7. THE WORK PHILOSOPHY
        ═══════════════════════════════════════════ */}
        <section className="grid grid-cols-1 [align-content:safe_center] h-[100svh] overflow-x-hidden overflow-y-auto px-[var(--gutter)] md:flex md:h-[100dvh] md:items-center md:overflow-hidden landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:items-start! landscape-short:py-14">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <div className="mx-auto max-w-[700px] text-center">
              <FadeUp active={active(4)}>
                <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                  The work
                </p>
              </FadeUp>

              <BigStatement text="The work we're most proud of, most people will never know we made." active={active(4)} className="text-center" />

              <FadeUp delay={0.15} active={active(4)}>
                <p className="mt-[var(--space-lg)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                  That&apos;s not false modesty. That&apos;s the goal. When a brand becomes so real, so lived-in, so theirs; when people carry it, wear it, post it, and believe in it without a second thought; the agency behind it disappears. And it should.
                </p>
              </FadeUp>

              <FadeUp delay={0.2} active={active(4)}>
                <p className="mt-[var(--space-md)] text-[1.1rem] font-semibold leading-[1.7] text-text-primary">
                  The best thing we can do is make something bigger than ourselves, then step back and watch it belong to the world.
                </p>
              </FadeUp>

              <FadeUp delay={0.25} active={active(4)}>
                <p className="mt-[var(--space-sm)] text-[0.95rem] text-text-tertiary italic">
                  That&apos;s why we exist.
                </p>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            5. CLOSING (last slide — releases the scroll lock so the
            global footer can flow in below via normal scroll)
        ═══════════════════════════════════════════ */}
        <section className="grid grid-cols-1 [align-content:safe_center] h-[100svh] overflow-x-hidden overflow-y-auto px-[var(--gutter)] md:flex md:h-[100dvh] md:items-center md:overflow-hidden landscape-short:h-auto! landscape-short:min-h-0! landscape-short:overflow-visible! landscape-short:items-start! landscape-short:py-14">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <FadeUp active={active(5)}>
              <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                Before you go
              </p>
            </FadeUp>

            <div className="max-w-[820px]">
              <BigStatement text="If you've read this far, we hope you felt something." active={active(5)} />

              <FadeUp delay={0.2} active={active(5)}>
                <p className="mt-[var(--space-lg)] max-w-[600px] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.6]">
                  A small warmth. A little confidence. Maybe a smile at the chaos of two kids building something real in a country still figuring out what &ldquo;brand&rdquo; means.
                </p>
              </FadeUp>
            </div>
          </div>
        </section>
      </motion.div>
    </div>

    {/* Careers gray band — flows in after the last slide, above the global footer */}
    <section className="bg-[#1e1e1e] px-[var(--gutter)] py-[var(--space-2xl)]">
      {/* Desktop — heading left, compact ghost pill right */}
      <div className="mx-auto hidden max-w-[var(--max-width)] md:flex md:items-center md:justify-between">
        <motion.h2
          className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em] text-text-primary"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Want to join our team?
        </motion.h2>

        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <CTAButton href="https://careers.boldcrest.com" label="Visit Careers" showArrow />
        </motion.div>
      </div>

      {/* Mobile — big bold statement + wide ghost pill below it, mirroring the home
          "We do many things very well." block (design only; keeps the People band's
          own dark colours, not the home zone colours). */}
      <div className="mx-auto max-w-[var(--max-width)] md:hidden">
        <motion.h2
          className="font-display text-[clamp(2.8rem,12vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] text-text-primary"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          Want to join our team?
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <a
            href="https://careers.boldcrest.com"
            className="mt-8 flex w-1/2 items-center justify-between gap-2 whitespace-nowrap rounded-full border border-white/25 px-5 py-4 text-[0.72rem] font-semibold uppercase tracking-[0.04em] text-text-secondary"
          >
            Visit Careers
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
    </>
  )
}
