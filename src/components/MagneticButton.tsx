'use client'

import { useRef, useCallback, ReactNode } from 'react'
import Link from 'next/link'

/* Three brand-coloured pill outlines that trail the cursor with staggered
   spring-like easing — inspired by Reform Collective.
   Lines are invisible by default and fade in on hover. */

const TRAIL_COLORS = ['#DA291C', '#f9b311', '#004c95']
const TRAIL_STRENGTHS = [0.4, 0.65, 0.9]
const MAX_OFFSET = 14

/* ── Shared base ─────────────────────────────────────────────── */

interface MagneticBaseProps {
  href?: string
  onClick?: () => void
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}

function MagneticBase({
  href,
  onClick,
  children,
  className = '',
  style,
}: MagneticBaseProps) {
  const containerRef = useRef<HTMLElement>(null)
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2

      layerRefs.current.forEach((layer, i) => {
        if (!layer) return
        const strength = TRAIL_STRENGTHS[i]
        const dx = nx * MAX_OFFSET * strength
        const dy = ny * MAX_OFFSET * strength
        layer.style.opacity = '1'
        layer.style.transform = `translate(${dx}px, ${dy}px)`
      })
    },
    [],
  )

  const handleMouseLeave = useCallback(() => {
    layerRefs.current.forEach((layer) => {
      if (!layer) return
      layer.style.opacity = '0'
      layer.style.transform = 'translate(0px, 0px)'
    })
  }, [])

  const trail = (
    <>
      {/* Trailing coloured outlines — hidden by default, revealed on hover */}
      {TRAIL_COLORS.map((color, i) => (
        <span
          key={color}
          ref={(el) => {
            layerRefs.current[i] = el
          }}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            border: `1.5px solid ${color}`,
            opacity: 0,
            transform: 'translate(0px, 0px)',
            transition: `transform ${0.35 + i * 0.2}s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease`,
            zIndex: 0,
          }}
          aria-hidden
        />
      ))}
      {children}
    </>
  )

  // Render a real button when there's an action instead of navigation
  if (onClick) {
    return (
      <button
        type="button"
        ref={containerRef as React.Ref<HTMLButtonElement>}
        onClick={onClick}
        className={`group relative cursor-pointer ${className}`}
        style={style}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {trail}
      </button>
    )
  }

  return (
    <Link
      ref={containerRef as React.Ref<HTMLAnchorElement>}
      href={href ?? '#'}
      className={`group relative ${className}`}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {trail}
    </Link>
  )
}

/* ── CTA Button  ("Start a Project") ─────────────────────────── */
/* White border pill, text-slide on hover, magnetic trailing lines */

const CUBIC = 'cubic-bezier(0.645, 0.045, 0.355, 1)'

export function CTAButton({
  href,
  onClick,
  label,
  showArrow = false,
  className = '',
}: {
  href?: string
  onClick?: () => void
  label: string
  showArrow?: boolean
  className?: string
}) {
  return (
    <MagneticBase
      href={href}
      onClick={onClick}
      className={`inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-white/25 px-5 py-[0.55rem] text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-text-secondary transition-all duration-[0.5s] hover:border-white/60 hover:text-white ${className}`}
      style={{ transitionTimingFunction: CUBIC }}
    >
      <span
        className="relative z-10 inline-flex overflow-hidden"
        style={{ height: '1.2em' }}
      >
        <span
          className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
          style={{ transitionTimingFunction: CUBIC }}
        >
          <span className="leading-[1.2]">{label}</span>
          <span className="leading-[1.2]">{label}</span>
        </span>
      </span>
      {showArrow && (
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="relative z-10 transition-transform duration-[0.5s] group-hover:translate-x-1" style={{ transitionTimingFunction: CUBIC }}>
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </MagneticBase>
  )
}

/* ── Inline Button  ("View All Work") ────────────────────────── */
/* Same style but with more vertical padding to match surrounding text height,
   plus optional trailing arrow icon */

export function InlineButton({
  href,
  label,
  showArrow = true,
  className = '',
}: {
  href: string
  label: string
  showArrow?: boolean
  className?: string
}) {
  return (
    <MagneticBase
      href={href}
      className={`inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-white/25 px-[1em] py-[0.42em] align-middle text-[0.35em] font-semibold uppercase tracking-[0.15em] text-text-secondary transition-all duration-[0.5s] hover:border-white/60 hover:text-white ${className}`}
      style={{ transitionTimingFunction: CUBIC, backgroundColor: '#000' }}
    >
      <span
        className="relative z-10 inline-flex overflow-hidden"
        style={{ height: '1.2em' }}
      >
        <span
          className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
          style={{ transitionTimingFunction: CUBIC }}
        >
          <span className="leading-[1.2]">{label}</span>
          <span className="leading-[1.2]">{label}</span>
        </span>
      </span>
      {showArrow && (
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          className="relative z-10 transition-transform duration-[0.5s] group-hover:translate-x-1"
          style={{ transitionTimingFunction: CUBIC }}
        >
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </MagneticBase>
  )
}

/* ── Submit Button  (form submit with magnetic trailing lines) ── */

export function SubmitButton({
  label,
  pendingLabel = 'Sending...',
  isPending = false,
  className = '',
}: {
  label: string
  pendingLabel?: string
  isPending?: boolean
  className?: string
}) {
  const containerRef = useRef<HTMLButtonElement>(null)
  const layerRefs = useRef<(HTMLSpanElement | null)[]>([])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2

      layerRefs.current.forEach((layer, i) => {
        if (!layer) return
        const strength = TRAIL_STRENGTHS[i]
        const dx = nx * MAX_OFFSET * strength
        const dy = ny * MAX_OFFSET * strength
        layer.style.opacity = '1'
        layer.style.transform = `translate(${dx}px, ${dy}px)`
      })
    },
    [],
  )

  const handleMouseLeave = useCallback(() => {
    layerRefs.current.forEach((layer) => {
      if (!layer) return
      layer.style.opacity = '0'
      layer.style.transform = 'translate(0px, 0px)'
    })
  }, [])

  return (
    <button
      ref={containerRef}
      type="submit"
      disabled={isPending}
      className={`group relative inline-flex items-center gap-3 rounded-[var(--radius-pill)] border border-white/25 bg-black px-6 py-[0.7rem] text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-text-secondary transition-all duration-[0.5s] hover:border-white/60 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ transitionTimingFunction: CUBIC, backgroundColor: '#000' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {TRAIL_COLORS.map((color, i) => (
        <span
          key={color}
          ref={(el) => {
            layerRefs.current[i] = el
          }}
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            border: `1.5px solid ${color}`,
            opacity: 0,
            transform: 'translate(0px, 0px)',
            transition: `transform ${0.35 + i * 0.2}s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease`,
            zIndex: 0,
          }}
          aria-hidden
        />
      ))}

      <span
        className="relative z-10 inline-flex overflow-hidden"
        style={{ height: '1.2em' }}
      >
        <span
          className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
          style={{ transitionTimingFunction: CUBIC }}
        >
          <span className="leading-[1.2]">
            {isPending ? pendingLabel : label}
          </span>
          <span className="leading-[1.2]">
            {isPending ? pendingLabel : label}
          </span>
        </span>
      </span>

      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        className="relative z-10 transition-transform duration-[0.5s] group-hover:translate-x-1"
        style={{ transitionTimingFunction: CUBIC }}
      >
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}

export default MagneticBase
