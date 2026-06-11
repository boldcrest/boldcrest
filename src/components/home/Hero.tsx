'use client'

import { motion } from 'framer-motion'

/* Desktop lines (md+) */
const DESKTOP_LINES = [
  [
    { text: 'Build', effect: null },
    { text: 'identities', effect: 'identities' },
    { text: 'and', effect: null },
  ],
  [
    { text: 'shape', effect: null },
    { text: 'perceptions', effect: 'perceptions' },
  ],
  [
    { text: 'Go', effect: null },
    { text: 'bold', effect: 'bold' },
    { text: 'or', effect: null },
    { text: 'go', effect: null },
    { text: 'unseen', effect: 'unseen' },
  ],
]

/* Mobile lines — "and" drops to line 2, "go unseen." gets its own line */
const MOBILE_LINES = [
  [
    { text: 'Build', effect: null },
    { text: 'identities', effect: 'identities' },
  ],
  [
    { text: 'and', effect: null },
    { text: 'shape', effect: null },
    { text: 'perceptions', effect: 'perceptions' },
  ],
  [
    { text: 'Go', effect: null },
    { text: 'bold', effect: 'bold' },
    { text: 'or', effect: null },
  ],
  [
    { text: 'go', effect: null },
    { text: 'unseen', effect: 'unseen' },
  ],
]

const lines = DESKTOP_LINES

function getWordDelay(lineSet: typeof DESKTOP_LINES, lineIndex: number, wordIndex: number): number {
  let total = 0
  for (let i = 0; i < lineIndex; i++) {
    total += lineSet[i].length
  }
  total += wordIndex
  return 0.1 + total * 0.1
}

function Word({
  text,
  effect,
  delay,
  isLastInLine,
}: {
  text: string
  effect: string | null
  delay: number
  isLastInLine: boolean
}) {
  const dotAfter =
    (effect === 'perceptions' || effect === 'unseen') && isLastInLine

  let hoverClasses = ''

  switch (effect) {
    case 'perceptions':
      hoverClasses =
        'transition-all duration-[0.4s] hover:skew-x-[-12deg] hover:text-transparent'
      break
    case 'bold':
      hoverClasses =
        'transition-all duration-[0.35s] hover:uppercase hover:font-black hover:tracking-[0.02em]'
      break
    case 'unseen':
      hoverClasses =
        'transition-all duration-[0.6s] hover:opacity-0 hover:blur-[12px] hover:translate-y-[10px] hover:scale-95'
      break
  }

  return (
    <motion.span
      className={`relative inline-block cursor-default ${hoverClasses}`}
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={
        effect === 'perceptions'
          ? {
              WebkitTextStroke: '0px transparent' as never,
              transitionTimingFunction: 'var(--ease-out-expo)',
            }
          : effect === 'unseen' || effect === 'bold'
            ? { transitionTimingFunction: 'var(--ease-out-expo)' }
            : undefined
      }
      onMouseEnter={
        effect === 'perceptions'
          ? (e) => {
              const el = e.currentTarget as HTMLElement
              ;(el.style as unknown as Record<string, string>).webkitTextStroke = '1.5px white'
            }
          : undefined
      }
      onMouseLeave={
        effect === 'perceptions'
          ? (e) => {
              const el = e.currentTarget as HTMLElement
              ;(el.style as unknown as Record<string, string>).webkitTextStroke = '0px transparent'
              el.style.color = ''
            }
          : undefined
      }
    >
      {text}
      {dotAfter && <span className="text-accent">.</span>}
    </motion.span>
  )
}

export default function Hero() {
  return (
    <section className="px-[var(--gutter)] pt-[clamp(8rem,17vh,14rem)] pb-[var(--space-2xl)]">
      {/* Desktop lines */}
      <h1 className="hidden font-display text-[clamp(3rem,8vw,7rem)] font-bold leading-[1.05] tracking-[-0.03em] md:block">
        {DESKTOP_LINES.map((line, lineIndex) => (
          <span key={lineIndex} className={`block ${lineIndex < DESKTOP_LINES.length - 1 ? 'overflow-hidden' : ''}`}>
            {line.map((word, wordIndex) => (
              <span key={wordIndex}>
                {wordIndex > 0 && ' '}
                <Word
                  text={word.text}
                  effect={word.effect}
                  delay={getWordDelay(DESKTOP_LINES, lineIndex, wordIndex)}
                  isLastInLine={wordIndex === line.length - 1}
                />
              </span>
            ))}
          </span>
        ))}
      </h1>

      {/* Mobile lines */}
      <h1 className="font-display text-[clamp(3rem,12vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] md:hidden">
        {MOBILE_LINES.map((line, lineIndex) => (
          <span key={lineIndex} className={`block ${lineIndex < MOBILE_LINES.length - 1 ? 'overflow-hidden' : ''}`}>
            {line.map((word, wordIndex) => (
              <span key={wordIndex}>
                {wordIndex > 0 && ' '}
                <Word
                  text={word.text}
                  effect={word.effect}
                  delay={getWordDelay(MOBILE_LINES, lineIndex, wordIndex)}
                  isLastInLine={wordIndex === line.length - 1}
                />
              </span>
            ))}
          </span>
        ))}
      </h1>
    </section>
  )
}
