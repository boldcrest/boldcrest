'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

interface Step {
  number: string
  title: string
  description: string
}

interface ProcessTableProps {
  label?: string
  heading: string
  intro?: string
  steps: Step[]
  accentColor?: string
}

export default function ProcessTable({
  label = 'Process',
  heading,
  intro,
  steps,
  accentColor = '#DA291C',
}: ProcessTableProps) {
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Drag-to-scroll (mouse only — touch keeps native momentum scroll)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, startX: 0, startScroll: 0 })

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
  }
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return
    drag.current.active = false
    scrollerRef.current?.releasePointerCapture?.(e.pointerId)
  }

  return (
    <section ref={ref} className="pt-[var(--space-lg)] pb-[var(--space-xl)]">
      {/* Heading block — respects max-width / gutter */}
      <div className="mx-auto max-w-[var(--max-width)] px-[var(--gutter)]">
        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {label}
        </motion.p>

        <motion.h2
          className="max-w-[700px] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em]"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        {intro && (
          <motion.p
            className="mt-4 max-w-[600px] text-[0.95rem] leading-[1.7] text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          >
            {intro}
          </motion.p>
        )}
      </div>

      {/* Steps — single horizontal drag-scroll row, hidden scrollbar, big faded numbers */}
      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerLeave={endDrag}
        className="mt-[var(--space-xl)] cursor-grab overflow-x-auto pb-4 select-none [scrollbar-width:none] active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="flex gap-8 md:gap-12"
          style={{
            width: 'max-content',
            paddingLeft:
              'max(var(--gutter), calc((100vw - var(--max-width)) / 2 + var(--gutter)))',
            paddingRight: 'var(--gutter)',
          }}
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className="group flex w-[clamp(260px,26vw,340px)] shrink-0 flex-col border-t border-border pt-6"
              style={{ ['--accent' as string]: accentColor }}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.1 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              <span className="font-display text-[clamp(3.5rem,7vw,6rem)] font-bold leading-[0.9] tracking-[-0.04em] text-text-tertiary/30 transition-colors duration-500 group-hover:text-[var(--accent)]">
                {step.number}
              </span>
              <h3 className="mt-6 mb-3 font-display text-[clamp(1.2rem,1.8vw,1.5rem)] font-bold leading-[1.15] tracking-[-0.01em] text-text-primary">
                {step.title}
              </h3>
              <p className="text-[0.85rem] leading-[1.7] text-text-secondary">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
