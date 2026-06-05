'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { CTAButton } from '@/components/MagneticButton'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

const capabilities = [
  {
    category: 'Brand Dev',
    number: '01',
    color: '#DA291C',
    heading: 'Brand Dev',
    abbr: 'BRND DEV',
    tags: [
      'Visual Identity',
      'Packaging Design',
      'Creative Advertising',
      'Brand Strategy',
      'Logo Design',
      'Brand Guidelines',
    ],
    description:
      "From brand architecture to visual identity, we create systems that clarify who you are and amplify how you're seen.",
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
    heading: 'Still & Motion',
    abbr: 'STL & MTN',
    tags: [
      'Photography',
      'Videography',
      'Animation',
      'Motion Graphics',
      'Post-Production',
      'Color Grading',
    ],
    description:
      'Still frames that hold attention. Moving images that move people. Every shoot, every cut, every grade — deliberate.',
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
    heading: 'Comms',
    abbr: 'COMMS',
    tags: [
      'Social Media',
      'Digital Marketing',
      'Public Relations',
      'Content Strategy',
      'Campaign Management',
      'Media Planning',
    ],
    description:
      'Strategy, content, and distribution — orchestrated to reach the right audience at the right moment.',
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
  const containerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const maxScroll = useRef(0)
  const { open: openStartProject } = useStartProject()

  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        maxScroll.current = trackRef.current.scrollWidth - window.innerWidth
      }
    }
    measure()
    window.addEventListener('resize', measure, { passive: true })
    return () => window.removeEventListener('resize', measure)
  }, [])

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  const x = useTransform(scrollYProgress, (v) => -v * maxScroll.current)

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Label */}
        <div className="flex items-center px-[var(--gutter)] pt-8 pb-6">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--zone-fg-half)' }}>
            What We Do
          </p>
        </div>

        {/* Top separator */}
        <div className="mx-[var(--gutter)] h-px" style={{ backgroundColor: 'var(--zone-fg-subtle)' }} />

        {/* Horizontal panels */}
        <motion.div
          ref={trackRef}
          className="flex h-[calc(100vh-82px)]"
          style={{ x }}
        >
          {capabilities.map((cap, i) => (
            <div
              key={cap.category}
              className="relative flex h-full shrink-0 flex-col justify-between"
              style={{
                width: '33.333vw',
                minWidth: '400px',
                borderRight: '1px solid var(--zone-fg-subtle)',
              }}
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
                    {cap.heading}
                  </h2>
                  <p className="max-w-[320px] text-[0.85rem] leading-[1.6]" style={{ color: 'var(--zone-fg-muted)' }}>
                    {cap.description}
                  </p>
                </div>

                {/* Bottom: service tags */}
                <div className="flex flex-wrap gap-2">
                  {cap.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/work?service=${encodeURIComponent(tag)}`}
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
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* CTA Panel */}
          <div
            className="relative flex h-full shrink-0 flex-col justify-between bg-[#0a0a0a] px-10 py-10 lg:px-16"
            style={{
              width: '33.333vw',
              minWidth: '400px',
            }}
          >
            <div>
              <h2 className="mb-8 font-display text-[clamp(2.5rem,5vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.03em] text-white">
                Start a<br />Project
              </h2>
            </div>

            <div className="flex flex-col gap-6">
              <p className="max-w-[320px] text-[0.85rem] leading-[1.7] text-white/80">
                We live in the details. The pixels, the strategy, the
                timing. If you&apos;re building something real, we&apos;ll
                meet you there.
              </p>
              <CTAButton onClick={openStartProject} label="Let's Chat" showArrow />
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  )
}
