'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useStartProject } from '@/components/start-project/StartProjectProvider'

const CUBIC = 'cubic-bezier(0.645, 0.045, 0.355, 1)'

interface ServiceCTAProps {
  label?: string
  heading: string
  description?: string
  buttonLabel?: string
  /** Draws the section divider above the CTA instead of on whatever follows. */
  topBorder?: boolean
  /**
   * Span the full gutter-to-gutter width instead of the centred --max-width
   * measure. The services sections all use the centred measure, but
   * RelatedProjects ("More Work") is full width — so on project pages the
   * centred CTA sat visibly indented from the carousel beneath it.
   */
  fullWidth?: boolean
}

/**
 * Conversion block that sits between "Why Us" and the FAQ.
 *
 * Placed there on purpose: the visitor has just read the argument for working
 * with us and has not yet dropped into the FAQ, which is where someone with an
 * objection goes. FAQSection already has its own small `ctaLabel` button for
 * afterwards — these two are complementary, so the service pages should not
 * suddenly start passing `ctaLabel` as well or the page ends on two buttons.
 *
 * Opens the global Start-a-Project chat panel rather than linking to /contact,
 * matching the header CTA and the other in-page buttons.
 */
export default function ServiceCTA({
  label = 'Next Step',
  heading,
  description,
  buttonLabel = 'Start a Project',
  topBorder = false,
  fullWidth = false,
}: ServiceCTAProps) {
  const { open: openStartProject } = useStartProject()
  const ref = useRef<HTMLElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section
      ref={ref}
      // No top padding: WhyUsSection above already carries pb-[var(--space-2xl)]
      // (6rem). Adding another 4rem on top stacked to a 10rem gap that read as a
      // break in the page rather than a continuation.
      className={`px-[var(--gutter)] ${
        topBorder ? 'pb-[var(--space-md)]' : 'pb-[var(--space-2xl)]'
      } ${
        topBorder ? 'border-t border-border pt-[var(--space-lg)]' : ''
      }`}
    >
      <div className={fullWidth ? 'w-full' : 'mx-auto max-w-[var(--max-width)]'}>
        <motion.p
          className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          {label}
        </motion.p>

        {/* Split once there is room: heading + copy left, button right, tops
            aligned. The eyebrow sits ABOVE this row on purpose — inside it,
            items-start would line the button up with the small grey label
            rather than the heading. Below md it stacks. */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between md:gap-[var(--space-2xl)]">
          <div className="md:max-w-[680px]">

        <motion.h2
          className="max-w-[760px] font-display text-[clamp(1.8rem,3.5vw,2.8rem)] font-bold leading-[1.1] tracking-[-0.02em] text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          {heading}
        </motion.h2>

        {description && (
          <motion.p
            className="mt-5 max-w-[560px] text-[0.95rem] leading-[1.7] text-text-secondary"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          >
            {description}
          </motion.p>
          )}
          </div>

          <motion.div
            className="mt-[var(--space-lg)] md:mt-0 md:shrink-0"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
            <CtaPill onClick={openStartProject} label={buttonLabel} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

/**
 * Styled inline rather than with the shared CTAButton because this renders as a
 * <button> (it opens the chat panel, so there is no href) and globals.css has an
 * un-layered `button { border: none; background: none }` reset that silently
 * strips Tailwind's border and background utilities — the stroke simply did not
 * appear. Inline styles beat that reset, which is the same fix the contact
 * form's SEND pill uses.
 *
 * Solid white with a black label. The hover move is the label roll-up plus the
 * arrow nudge — the fill deliberately does not change, so the button reads as
 * one stable shape and the motion is all in the type.
 */
function CtaPill({ onClick, label }: { onClick: () => void; label: string }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group inline-flex cursor-pointer items-center gap-3 text-[0.7rem] font-semibold uppercase"
      style={{
        letterSpacing: '0.12em',
        padding: '0.8rem 1.6rem',
        borderRadius: 'var(--radius-pill)',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#fff',
        backgroundColor: '#fff',
        color: '#0a0a0a',
        transitionProperty: 'background-color, border-color, color',
        transitionDuration: '0.5s',
        transitionTimingFunction: CUBIC,
      }}
    >
      {/* label rolls up on hover, matching the header CTA */}
      <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
        <span
          className="relative top-[0.1em] flex flex-col"
          style={{
            transform: hover ? 'translateY(-50%)' : 'translateY(0)',
            transition: `transform 0.5s ${CUBIC}`,
          }}
        >
          <span className="leading-[1.2]">{label}</span>
          <span className="leading-[1.2]">{label}</span>
        </span>
      </span>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        style={{
          transform: hover ? 'translateX(4px)' : 'translateX(0)',
          transition: `transform 0.5s ${CUBIC}`,
        }}
      >
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
