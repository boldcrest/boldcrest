'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
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

interface PeoplePageClientProps {
  members: TeamMember[]
}

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
function PhotoMarquee() {
  const photos = [1, 2, 3, 4, 5, 6, 7]
  const repeated = [...photos, ...photos, ...photos, ...photos]
  const scrollerRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0 })
  const frac = useRef(0)
  const SPEED = 70 // px per second

  useEffect(() => {
    const el = scrollerRef.current
    if (!el) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (!last) last = now
      const dt = (now - last) / 1000
      last = now
      if (!drag.current.active) {
        // Accumulate fractional pixels and only add whole-pixel steps — Safari/
        // Firefox round scrollLeft to integers, so sub-pixel increments are lost.
        frac.current += SPEED * dt
        const step = Math.floor(frac.current)
        if (step > 0) {
          frac.current -= step
          el.scrollLeft += step
          const oneSet = el.scrollWidth / 4
          if (oneSet > 0 && el.scrollLeft >= oneSet) el.scrollLeft -= oneSet
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX)
    const oneSet = el.scrollWidth / 4
    if (oneSet > 0) {
      if (el.scrollLeft >= oneSet) el.scrollLeft -= oneSet
      else if (el.scrollLeft < 0) el.scrollLeft += oneSet
    }
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    scrollerRef.current?.releasePointerCapture?.(e.pointerId)
  }

  if (photos.length === 0) return null

  return (
    <div
      ref={scrollerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
      onDragStart={(e) => e.preventDefault()}
      className="flex h-[50dvh] w-full shrink-0 cursor-grab touch-pan-y select-none overflow-x-auto [scrollbar-width:none] [@media(max-height:820px)]:h-[42dvh] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex h-full w-max">
        {repeated.map((n, i) => (
          <div key={i} className="group relative h-full aspect-[1286/1500] shrink-0">
            <Image
              src={`/People - Photos/${n}.jpg`}
              alt={`BoldCrest team ${n}`}
              fill
              sizes="(max-width: 768px) 70vw, 34vw"
              draggable={false}
              priority={i < 5}
              className="pointer-events-none object-cover grayscale transition-[filter] duration-500 group-hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

type FaceItem = {
  id: string
  name: string
  role?: string
  image?: TeamMember['image']
  localSrc?: string
}

/* ── Faces gallery — two rows, looping auto-scroll + drag ── */
function FacesGallery({ team }: { team: FaceItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0 })
  const frac = useRef(0)
  const SPEED = 40 // px per second
  const repeated = team.length ? [...team, ...team, ...team, ...team] : []

  useEffect(() => {
    const el = scrollerRef.current
    if (!el || !team.length) return
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (!last) last = now
      const dt = (now - last) / 1000
      last = now
      if (!drag.current.active) {
        // Accumulate fractional pixels and only add whole-pixel steps — Safari/
        // Firefox round scrollLeft to integers, so sub-pixel increments are lost.
        frac.current += SPEED * dt
        const step = Math.floor(frac.current)
        if (step > 0) {
          frac.current -= step
          el.scrollLeft += step
          const oneSet = el.scrollWidth / 4
          if (oneSet > 0 && el.scrollLeft >= oneSet) el.scrollLeft -= oneSet
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [team.length])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return
    const el = scrollerRef.current
    if (!el) return
    drag.current = { active: true, startX: e.clientX, startScroll: el.scrollLeft }
    el.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    const el = scrollerRef.current
    if (!el) return
    el.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX)
    const oneSet = el.scrollWidth / 4
    if (oneSet > 0) {
      if (el.scrollLeft >= oneSet) el.scrollLeft -= oneSet
      else if (el.scrollLeft < 0) el.scrollLeft += oneSet
    }
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    scrollerRef.current?.releasePointerCapture?.(e.pointerId)
  }

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
      onPointerLeave={endDrag}
      onDragStart={(e) => e.preventDefault()}
      className="w-full cursor-grab touch-pan-y select-none overflow-x-auto [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
    >
      <div className="grid w-max grid-flow-col grid-rows-2 gap-[0.625rem] md:gap-3">
        {repeated.map((member, i) => (
          <div
            key={i}
            className="group relative aspect-[5/7] w-[clamp(150px,16vw,220px)] shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-bg-card"
          >
            {member.image?.asset ? (
              <Image
                loader={sanityImageLoader}
                src={urlFor(member.image).width(600).url()}
                alt={member.name}
                fill
                draggable={false}
                loading="lazy"
                className="pointer-events-none object-cover"
                sizes="(max-width: 768px) 30vw, 16vw"
              />
            ) : member.localSrc ? (
              <Image
                src={member.localSrc}
                alt={member.name}
                fill
                draggable={false}
                loading="lazy"
                className="pointer-events-none object-cover"
                sizes="(max-width: 768px) 30vw, 16vw"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="h-12 w-12 rounded-full border-2 border-text-tertiary" />
              </div>
            )}
            <div
              className="pointer-events-none absolute inset-0 flex flex-col justify-end p-[var(--space-sm)] opacity-0 transition-opacity duration-[0.4s] group-hover:opacity-100"
              style={{
                background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.8) 100%)',
                transitionTimingFunction: 'var(--ease-out-expo)',
              }}
            >
              <h3
                className="translate-y-2 font-display text-[0.95rem] font-semibold leading-tight transition-transform duration-[0.4s] group-hover:translate-y-0"
                style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
              >
                {member.name}
              </h3>
              {member.role && (
                <span
                  className="mt-0.5 translate-y-2 text-[0.65rem] uppercase tracking-[0.1em] text-text-secondary transition-transform duration-[0.4s] group-hover:translate-y-0"
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
}

export default function PeoplePageClient({ members }: PeoplePageClientProps) {
  const [current, setCurrent] = useState(0)
  const [isLocked, setIsLocked] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  // False right after we land on the last slide; true once the snap settles and
  // page-scroll to the footer is allowed (absorbs hard-scroll momentum).
  const lastSlideReady = useRef(false)
  const lenis = useLenis()

  // On mobile the full-screen slide deck can't hold tall content, so we fall
  // back to a normal scrolling page (sections grow + stack). Desktop keeps the
  // wheel-jacked deck.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
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
  }, [lenis, current])

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

  // Wheel handler
  useEffect(() => {
    const el = containerRef.current
    if (!el || isMobile) return

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
      e.preventDefault()
      if (isLocked) return
      if (Math.abs(e.deltaY) < 15) return // ignore tiny scroll
      if (e.deltaY > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [current, isLocked, goTo, isMobile])

  // Touch handler
  useEffect(() => {
    const el = containerRef.current
    if (!el || isMobile) return

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const last = TOTAL_SECTIONS - 1
      const diff = touchStartY.current - e.changedTouches[0].clientY
      // On the final slide, allow native scroll to the footer; only step back
      // into the deck on a downward swipe when the page is at the top.
      if (current === last) {
        if (diff < 0 && window.scrollY <= 0 && !isLocked && Math.abs(diff) > 50) {
          goTo(current - 1)
        }
        return
      }
      if (isLocked) return
      if (Math.abs(diff) < 50) return
      if (diff > 0) goTo(current + 1)
      else goTo(current - 1)
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchend', onTouchEnd)
    }
  }, [current, isLocked, goTo, isMobile])

  // Keyboard handler
  useEffect(() => {
    if (isMobile) return
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
  }, [current, goTo, isMobile])

  // Lock page scroll while navigating slides; release on the last slide so the
  // footer below the deck can be reached with a normal scroll. Lock the <html>
  // element too — body-only is not enough now that the document is taller than
  // the viewport (the footer sits below the in-flow deck). On mobile the deck is
  // disabled, so the page must scroll freely — never lock.
  useEffect(() => {
    const html = document.documentElement
    const last = TOTAL_SECTIONS - 1
    if (isMobile || current === last) {
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
  }, [current, isMobile])

  // Footer "back to top" resets the deck to the first slide. Setting current to
  // 0 also triggers the body-lock effect above, which scrolls the document up.
  useEffect(() => {
    const handler = () => setCurrent(0)
    window.addEventListener('boldcrest:back-to-top', handler)
    return () => window.removeEventListener('boldcrest:back-to-top', handler)
  }, [])

  const active = (i: number) => isMobile || current === i

  // Faces grid — local preview photos for now; Sanity members take over
  // once optimized images are uploaded (empty LOCAL_TEAM to switch back).
  const team =
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
        }))

  return (
    <>
    <div
      ref={containerRef}
      className={isMobile ? 'relative bg-bg' : 'relative h-[100dvh] overflow-hidden bg-bg'}
    >
      {/* Sliding wrapper — deck translates on desktop, static (normal scroll) on mobile */}
      <motion.div
        className="relative will-change-transform"
        animate={{ y: isMobile ? 0 : `${-current * 100}dvh` }}
        transition={{ duration: TRANSITION_DURATION / 1000, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* ═══════════════════════════════════════════
            0. HERO
        ═══════════════════════════════════════════ */}
        <section className="relative flex min-h-[100dvh] md:h-[100dvh] flex-col overflow-hidden bg-bg">
          {/* Hero copy — full-width stretch, top-aligned to match Work/Services/Diary */}
          <div className="flex min-h-0 flex-1 items-start px-[var(--gutter)] pt-[120px] [@media(max-height:780px)]:pt-[92px]">
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
                    Two earthquakes,{' '}
                    <br className="hidden md:block" />
                    a pandemic, and{' '}
                    <br className="hidden md:block" />
                    a decision<span className="text-text-tertiary">.</span>
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

                {/* Right — story copy, right-aligned */}
                <motion.div
                  className="max-w-[440px] md:text-right"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                >
                  <p className="text-[1.05rem] leading-[1.8] text-text-secondary">
                    The ground shook twice. The world shut down. And somewhere in the middle of all of that, two 22-year-olds decided it was a good time to build an agency.
                  </p>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Photo band — auto-scrolling, draggable, b&w → color on hover (5 shown) */}
          <PhotoMarquee />
        </section>

        {/* ═══════════════════════════════════════════
            1. THE MOTTO
        ═══════════════════════════════════════════ */}
        <section className="flex min-h-[100dvh] md:h-[100dvh] items-center overflow-hidden px-[var(--gutter)]">
          <div className="mx-auto w-full max-w-[var(--max-width)] text-center">
            <FadeUp active={active(1)}>
              <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                Our motto
              </p>
            </FadeUp>

            <BigStatement text="Climbing Mountains Together." active={active(1)} className="text-center" />

            <div className="mx-auto mt-[var(--space-xl)] flex max-w-[640px] flex-col gap-[var(--space-md)]">
              <FadeUp delay={0.1} active={active(1)}>
                <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                  It means we don&apos;t hand you a deliverable and disappear. We sit in your meetings. We learn your operations. We understand your problems before we try to solve them.
                </p>
              </FadeUp>

              <FadeUp delay={0.15} active={active(1)}>
                <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                  We push back when we think you&apos;re wrong, not to be difficult, but because that&apos;s what real partners do. And when we&apos;re wrong, we listen.
                </p>
              </FadeUp>
            </div>

            <FadeUp delay={0.25} active={active(1)}>
              <p className="mx-auto mt-[var(--space-2xl)] max-w-[900px] font-display text-[clamp(1.4rem,2.8vw,2.4rem)] font-bold leading-[1.25] tracking-[-0.01em] text-text-primary">
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
        <section className="flex min-h-[100dvh] md:h-[100dvh] items-center overflow-hidden px-[var(--gutter)]">
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
                  <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                    Xhulio is a superstar in everything visual. Aldo builds relationships that last. When the two of us became friends, the equation was simple: his eye, his instinct, his creativity, matched with the trust, the conversations, the partnerships that turn a single project into a decade-long journey.
                  </p>
                </FadeUp>

                <FadeUp delay={0.15} active={active(2)}>
                  <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                    We didn&apos;t merge dreams. We merged what we were each already best at. And that combination became BoldCrest.
                  </p>
                </FadeUp>

                <FadeUp delay={0.2} active={active(2)}>
                  <p className="text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                    We took our first team from the same university halls we were still sitting in. We were 22. We were probably not ready. We did it anyway. And what we brought to the market, at a time when no one else was bringing it, was real creative thinking to social media. Not content. Ideas.
                  </p>
                </FadeUp>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════
            3. TEAM CULTURE + FACES (combined)
        ═══════════════════════════════════════════ */}
        <section className="flex min-h-[100dvh] md:h-[100dvh] items-center overflow-hidden px-[var(--gutter)] pt-[80px]">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <div className="grid items-center gap-[var(--space-2xl)] md:grid-cols-2">
              {/* Left — culture copy */}
              <div className="min-w-0">
                <FadeUp active={active(3)}>
                  <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                    The team
                  </p>
                </FadeUp>

                <BigStatement text="Every person has a glitch in their system." active={active(3)} />

                <FadeUp delay={0.1} active={active(3)}>
                  <p className="mt-[var(--space-lg)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
                    Something slightly off, slightly unusual, slightly theirs. And that&apos;s exactly what makes them belong here. We are different people who are somehow made of the same thing.
                  </p>
                </FadeUp>

                <FadeUp delay={0.15} active={active(3)}>
                  <p className="mt-[var(--space-md)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
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
        <section className="flex min-h-[100dvh] md:h-[100dvh] items-center overflow-hidden px-[var(--gutter)]">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <div className="mx-auto max-w-[700px] text-center">
              <FadeUp active={active(4)}>
                <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                  The work
                </p>
              </FadeUp>

              <BigStatement text="The work we're most proud of, most people will never know we made." active={active(4)} className="text-center" />

              <FadeUp delay={0.15} active={active(4)}>
                <p className="mt-[var(--space-lg)] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
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
        <section className="flex min-h-[100dvh] md:h-[100dvh] items-center overflow-hidden px-[var(--gutter)]">
          <div className="mx-auto w-full max-w-[var(--max-width)]">
            <FadeUp active={active(5)}>
              <p className="mb-[var(--space-md)] text-[0.75rem] font-semibold uppercase tracking-[0.25em] text-text-tertiary">
                Before you go
              </p>
            </FadeUp>

            <div className="max-w-[820px]">
              <BigStatement text="If you've read this far, we hope you felt something." active={active(5)} />

              <FadeUp delay={0.2} active={active(5)}>
                <p className="mt-[var(--space-lg)] max-w-[600px] text-[0.875rem] leading-[1.6] text-text-secondary md:text-[1rem] md:leading-[1.85]">
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
      <div className="mx-auto flex max-w-[var(--max-width)] flex-col items-start gap-[var(--space-lg)] md:flex-row md:items-center md:justify-between">
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
          <CTAButton href="/careers" label="Visit Careers" showArrow />
        </motion.div>
      </div>
    </section>
    </>
  )
}
