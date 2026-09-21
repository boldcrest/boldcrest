'use client'

import { useRef, useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform, useSpring } from 'framer-motion'
import { useStartProject } from '@/components/start-project/StartProjectProvider'
import { useTranslations } from 'next-intl'

const capabilities = [
  {
    category: 'Brand Dev',
    number: '01',
    color: '#DA291C',
    headingKey: 'brandDev',
    abbr: 'BRND DEV',
    href: '/services/brand-development',
    tags: [
      'visualIdentity',
      'packagingDesign',
      'creativeAdvertising',
      'brandStrategy',
      'logoDesign',
      'brandGuidelines',
    ],
    descriptionKey: 'brandDevDesc',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 4L4 14v12l16 10 16-10V14L20 4z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 14v12M12 19l8 5 8-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    category: 'Still & Motion',
    number: '02',
    color: '#f9b311',
    headingKey: 'stillMotion',
    abbr: 'STL & MTN',
    href: '/services/still-motion',
    tags: [
      'photography',
      'videography',
      'animation',
      'motionGraphics',
      'postProduction',
      'colorGrading',
    ],
    descriptionKey: 'stillMotionDesc',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="6" y="10" width="28" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    category: 'Communications',
    number: '03',
    color: '#004c95',
    headingKey: 'comms',
    abbr: 'COMMS',
    href: '/services/communication',
    tags: [
      'socialMedia',
      'digitalMarketing',
      'publicRelations',
      'contentStrategy',
      'campaignManagement',
      'mediaPlanning',
    ],
    descriptionKey: 'commsDesc',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M8 12h24v16H22l-6 4v-4H8V12z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <circle cx="16" cy="20" r="1.5" fill="currentColor" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
        <circle cx="24" cy="20" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
]

export default function ServiceCards() {
  const t = useTranslations('Home')
  const ts = useTranslations('Services')
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const { open: openStartProject } = useStartProject()

  // Geometry is measured in pixels so that on MOBILE the pinned section lasts
  // exactly the horizontal pan distance (+ a hold), instead of an arbitrary
  // `200vh`. With `200vh` the section height (large viewport) and the sticky
  // `svh` height disagreed, so the pin released — and vertical scrolling resumed
  // — before the horizontal pan finished, dropping the last panel early and
  // cutting the bottom. Desktop keeps the CSS `200vh` + linear pan (untouched).
  const [maxScroll, setMaxScroll] = useState(0)
  const [mobileSectionH, setMobileSectionH] = useState(0) // 0 → desktop: CSS 200vh
  const [holdPoint, setHoldPoint] = useState(1) // 1 → desktop: linear pan

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current
      if (!track) return
      const iw = window.innerWidth
      const ih = window.innerHeight
      const ms = Math.max(0, track.scrollWidth - iw)
      setMaxScroll(ms)
      if (iw < 768 && ms > 0) {
        // Pin lasts: one screen of pan room is implicit; add the pan distance so
        // 1px of vertical scroll ≈ 1px of horizontal pan (natural feel), then a
        // short HOLD so the spring settles and the end-stick is FELT but brief
        // before the pin releases (0.3 screen — was 0.5, which lingered too long).
        const hold = Math.round(ih * 0.3)
        setMobileSectionH(ih + ms + hold)
        setHoldPoint(ms / (ms + hold))
      } else {
        setMobileSectionH(0)
        setHoldPoint(1)
      }
    }
    let lastW = window.innerWidth
    measure()
    // Ignore HEIGHT-ONLY resizes. Mobile browsers fire `resize` every time the
    // URL bar shows/hides on scroll (same width, different height). Recomputing
    // the mobile section height on each of those toggles re-lays-out this pinned
    // section mid-scroll, which shifts everything below it — felt as a small jump
    // near the staff section when you reverse scroll direction (the URL bar
    // toggles on direction change). Only remeasure on a real width/orientation
    // change; the height stays stable (the end HOLD absorbs URL-bar height drift).
    const onResize = () => {
      if (window.innerWidth === lastW) return
      lastW = window.innerWidth
      measure()
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Pan to the end by `holdPoint` of the pinned scroll, then HOLD the final frame
  // for the remainder. The hold lets the smoothing spring settle on the "Start a
  // Project" panel, so the horizontal pan is fully complete and locked before the
  // pin releases and vertical scrolling resumes. (Desktop holdPoint=1 → linear.)
  const xRaw = useTransform(scrollYProgress, (v) => {
    const t = holdPoint < 1 ? Math.min(v / holdPoint, 1) : v
    return -t * maxScroll
  })
  // Smooth the scroll-linked transform: iOS throttles scroll events during
  // momentum, which makes the raw mapping stutter. A light spring interpolates
  // between the sparse samples so the horizontal track glides.
  const x = useSpring(xRaw, { stiffness: 220, damping: 40, mass: 0.25 })

  return (
    <section
      ref={containerRef}
      className="relative h-[200vh]"
      style={mobileSectionH ? { height: mobileSectionH } : undefined}
    >
      <div className="sticky top-0 h-[100dvh] overflow-hidden">
        {/* Label — top padding clears the fixed menu pill at every breakpoint
            (the section pins under the menu while it scrolls); the gap from the
            menu to the heading matches the gap below it (pb-6). */}
        <div className="flex items-center px-[var(--gutter)] pt-[6rem] pb-6">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--zone-fg-half)' }}>
            {t('whatWeDo')}
          </p>
        </div>

        {/* Top separator */}
        <div className="mx-[var(--gutter)] h-px" style={{ backgroundColor: 'var(--zone-fg-subtle)' }} />

        {/* Horizontal panels */}
        <motion.div
          ref={trackRef}
          // backface-visibility:hidden stops an iOS Safari ghost: when the URL
          // bar toggles during an overscroll pull near the end, the dvh height
          // changes and Safari double-paints this will-change layer (the CTA text
          // appeared duplicated). Hidden backface forces a clean single repaint.
          className="flex h-[calc(100dvh-150px)] will-change-transform [backface-visibility:hidden] [-webkit-backface-visibility:hidden]"
          style={{ x }}
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.category}
              className="relative flex h-full w-screen shrink-0 flex-col justify-between md:w-[33.333vw] md:min-w-[400px]"
              style={{ borderRight: '1px solid var(--zone-fg-subtle)' }}
            >
              <div
                className="flex h-full flex-col justify-between py-8 lg:py-10"
                style={{
                  paddingLeft: i === 0 ? 'var(--gutter)' : 'clamp(1.5rem, 2vw, 2.5rem)',
                  paddingRight: 'clamp(1.5rem, 2vw, 2.5rem)',
                }}
              >
                {/* Top: heading + description */}
                <div>
                  <h2 className="mb-4 font-display text-[clamp(2.5rem,5vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em]" style={{ color: 'var(--zone-fg)' }}>
                    {t(cap.headingKey)}
                  </h2>
                  <p className="max-w-[320px] text-[0.85rem] leading-[1.6]" style={{ color: 'var(--zone-fg-muted)' }}>
                    {t(cap.descriptionKey)}
                  </p>
                </div>

                {/* Bottom: service tags. These point at the card's real service
                    page, NOT a /work?service=<tag> filter: most tags here
                    (Visual Identity, Logo Design, Motion Graphics, Media
                    Planning…) are not values in the project `services` list, so
                    those filters matched zero projects. Same reasoning as the
                    footer's service column — link the indexable service pages. */}
                <div className="flex flex-wrap gap-2">
                  {cap.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={cap.href}
                      className="rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.05em] transition-all duration-200"
                      style={{
                        borderColor: 'var(--zone-fg-faint)',
                        color: 'var(--zone-fg-half)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = cap.color
                        e.currentTarget.style.backgroundColor = `${cap.color}15`
                        e.currentTarget.style.color = 'var(--zone-fg)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--zone-fg-faint)'
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.color = 'var(--zone-fg-half)'
                      }}
                    >
                      {ts(tag)}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* CTA Panel — on mobile it fills the screen and its left padding is
              the page gutter, so "Start a Project" starts at the same x as the
              diary/other sections once the pan lands it flush at the left. */}
          <div className="relative flex h-full w-screen shrink-0 flex-col justify-between bg-[#0a0a0a] py-10 pl-[var(--gutter)] pr-[var(--gutter)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] md:w-[33.333vw] md:min-w-[400px] md:px-[clamp(1.5rem,2vw,2.5rem)]">
            <div>
              <h2 className="mb-8 font-display text-[clamp(2.5rem,5vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
                {t('startA')}<br />{t('project')}
              </h2>
            </div>

            {/* Promote the CTA copy to its OWN compositor layer (translateZ + z-10)
                so it always paints ABOVE the panel's background tile. On iOS the
                URL bar toggling near the section end changes 100dvh, re-lays-out
                this bottom-pinned block, and Safari can leave a stale background
                tile over the first line of the paragraph (the "box" covering the
                text). A separate, isolated layer can't be occluded by that tile. */}
            <div className="relative z-10 flex flex-col gap-6 [transform:translateZ(0)] [-webkit-transform:translateZ(0)]">
              <p className="max-w-[320px] text-[0.85rem] leading-[1.7] text-white/80">
                {t('serviceIntro')}
              </p>
              <button
                type="button"
                onClick={openStartProject}
                className="group/chat flex items-center gap-2 self-start text-[0.85rem] font-semibold uppercase tracking-[0.15em] text-white transition-all duration-[0.5s] hover:gap-3"
                style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
              >
                <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
                  <span
                    className="flex flex-col transition-transform duration-[0.5s] group-hover/chat:-translate-y-1/2"
                    style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                  >
                    <span className="leading-[1.2]">{t('letsChat')}</span>
                    <span className="leading-[1.2]">{t('letsChat')}</span>
                  </span>
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform duration-[0.5s] group-hover/chat:translate-x-1"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                >
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
