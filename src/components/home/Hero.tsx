'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLocale, useTranslations } from 'next-intl'

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


/* ── Hero copy per locale ───────────────────────────────────────────────────
   English keeps the hand-tuned arrays above: they encode where the line breaks
   fall at each breakpoint, which no amount of splitting can reproduce.

   For every other language the lines are built from the translated sentences.
   Four words carry a hover effect; translators supplied each one AS IT APPEARS
   in their sentence (Albanian's "unseen" is the two-word "në hije"), so the
   phrases are matched longest-first and kept as a single token. The trailing
   full stop is dropped because the component draws its own accent dot. */
type HeroWord = { text: string; effect: string | null }

function splitWithEffects(
  line: string,
  effects: { phrase: string; effect: string }[],
): HeroWord[] {
  const ordered = [...effects].sort((a, b) => b.phrase.length - a.phrase.length)
  const out: HeroWord[] = []
  let rest = line.replace(/[.]\s*$/, '').trim()
  while (rest.length > 0) {
    const hit = ordered.find(
      (e) => e.phrase && rest.toLowerCase().startsWith(e.phrase.toLowerCase()),
    )
    if (hit) {
      out.push({ text: rest.slice(0, hit.phrase.length), effect: hit.effect })
      rest = rest.slice(hit.phrase.length).trim()
      continue
    }
    const next = rest.indexOf(' ')
    if (next === -1) {
      out.push({ text: rest, effect: null })
      break
    }
    out.push({ text: rest.slice(0, next), effect: null })
    rest = rest.slice(next + 1).trim()
  }
  return out
}

/* Entrance reveals LINE BY LINE (Apple "take a closer look." style), not word by
   word. The catch: the logical line arrays above are only a starting point — at
   narrow widths a line like "and shape perceptions." wraps into TWO visual lines,
   and those must still stagger, not reveal together. So we don't key the delay to
   the array index; we MEASURE each word's real rendered row (offsetTop) after
   layout and group by that. Works on any device / any wrap. Desktop type is
   bigger so it can breathe a little more; mobile gets a tighter stagger. */
const BASE_DELAY = 0.1
const LINE_STAGGER_DESKTOP = 0.14
const LINE_STAGGER_MOBILE = 0.11

function Word({
  text,
  effect,
  delay,
  isLastInLine,
  reduce,
  li,
}: {
  text: string
  effect: string | null
  delay: number | null
  isLastInLine: boolean
  reduce: boolean
  li: number
}) {
  const dotAfter =
    (effect === 'perceptions' || effect === 'unseen') && isLastInLine

  // The hover effect is enabled only AFTER the entrance animation finishes. The
  // hover classes carry `transition-all`, which otherwise CSS-transitions the
  // very transform/opacity that framer-motion is driving frame-by-frame during
  // the entrance — the two fight each other and the word flickers/jumps on load
  // (most visibly on mobile). Holding the transition back until entrance
  // completes lets framer animate cleanly, then restores the hover behavior
  // unchanged. `hover-fine:` (see globals.css) gates the hover on `any-hover`
  // so it works with a mouse/trackpad on iPad/iPhone but never sticks on touch.
  const [hoverReady, setHoverReady] = useState(false)
  // The accent full-stop after a word. It's a child of the word span,
  // so it already inherits the parent's skew + (for 'perceptions') the white
  // text-stroke. But its OWN fill colour wouldn't go transparent on hover the way
  // the letters do — so on a 'perceptions' hover we flip just the dot's fill to
  // transparent in sync, leaving an outlined dot that matches the outlined letters
  // instead of a solid dot sitting inside the hollow word.
  const dotRef = useRef<HTMLSpanElement>(null)

  let hoverClasses = ''

  switch (effect) {
    case 'perceptions':
      hoverClasses =
        'transition-all duration-[0.4s] hover-fine:skew-x-[-12deg] hover-fine:text-transparent'
      break
    case 'bold':
      hoverClasses =
        'transition-all duration-[0.35s] hover-fine:uppercase hover-fine:font-black hover-fine:tracking-[0.02em]'
      break
    case 'unseen':
      // Blur restored. The crop in the screenshot is a Safari bug: it clips a
      // `filter: blur` element's halo to the element's OWN border-box when an
      // ancestor has `overflow-x: clip` (our html/body — load-bearing for the
      // sticky sections), so the soft edges got sliced into hard vertical lines on
      // the left/right of "unseen". Fix = the `boxPad` below (`px-[0.5em]`) widens
      // the box so the 10px halo lands INSIDE it instead of at the clipped edge.
      hoverClasses =
        'transition-all duration-[0.6s] hover-fine:opacity-0 hover-fine:blur-[10px] hover-fine:scale-90'
      break
  }

  // Always-on horizontal breathing room for the blurred word, NOT gated on the
  // hover transition — so the box is already wide enough the instant the blur
  // applies (no wobble) and the halo is never clipped. `-mx` cancels the padding
  // width so resting layout / letter-spacing is pixel-identical.
  const boxPad = effect === 'unseen' ? 'px-[0.5em] -mx-[0.5em]' : ''

  // `delay` is null until the heading has measured its real line layout. Until
  // then the word stays parked at its hidden start (no entrance), so the reveal
  // only fires once we know which visual row this word landed on.
  const show = delay !== null
  const hiddenState = reduce ? { opacity: 0 } : { opacity: 0, y: '100%' }
  const shownState = reduce ? { opacity: 1 } : { opacity: 1, y: 0 }

  return (
    <motion.span
      data-word=""
      data-li={li}
      className={`relative inline-block cursor-default select-none [-webkit-tap-highlight-color:transparent] ${boxPad} ${hoverReady ? hoverClasses : ''}`}
      initial={hiddenState}
      animate={show ? shownState : hiddenState}
      onAnimationComplete={() => {
        if (show) setHoverReady(true)
      }}
      transition={{
        duration: reduce ? 0.5 : 0.9,
        delay: show && !reduce ? (delay as number) : 0,
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
              // Touch taps emit a synthetic mouseenter on iOS; without this guard
              // the stroke would apply and STICK on tap. Only react to a real
              // hover-capable pointer (mouse/trackpad), matching the CSS gate.
              if (!window.matchMedia('(any-hover: hover)').matches) return
              const el = e.currentTarget as HTMLElement
              ;(el.style as unknown as Record<string, string>).webkitTextStroke = '1.5px white'
              // Outline the dot too, in sync, so it matches the hollow letters.
              if (dotRef.current) dotRef.current.style.color = 'transparent'
            }
          : undefined
      }
      onMouseLeave={
        effect === 'perceptions'
          ? (e) => {
              const el = e.currentTarget as HTMLElement
              ;(el.style as unknown as Record<string, string>).webkitTextStroke = '0px transparent'
              el.style.color = ''
              if (dotRef.current) dotRef.current.style.color = ''
            }
          : undefined
      }
    >
      {text}
      {dotAfter && (
        <span
          ref={dotRef}
          className="text-accent transition-all duration-[0.4s]"
          style={{ transitionTimingFunction: 'var(--ease-out-expo)' }}
        >
          .
        </span>
      )}
    </motion.span>
  )
}

type Line = { text: string; effect: string | null }[]

/* One heading (desktop or mobile). Renders the words hidden, then after layout
   measures each word's real rendered row and assigns the entrance delay per
   VISUAL line — so a logical line that wraps still staggers row by row. */
function AnimatedHeading({
  lines,
  stagger,
  reduce,
  className,
}: {
  lines: Line[]
  stagger: number
  reduce: boolean
  className: string
}) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  // delays: per-word entrance delay, in DOM order (null until measured).
  const [delays, setDelays] = useState<number[] | null>(null)
  // maskRows: how many visual rows each logical line occupies (≥1). A line that
  // wraps (>1) drops its slide-up mask so the wrapped row isn't half-clipped.
  const [maskRows, setMaskRows] = useState<number[] | null>(null)

  useEffect(() => {
    const measure = () => {
      const h = headingRef.current
      // offsetParent is null when this heading is display:none (the inactive
      // breakpoint) — skip; it'll be measured if/when it becomes visible.
      if (!h || h.offsetParent === null) return
      const words = Array.from(h.querySelectorAll<HTMLElement>('[data-word]'))
      if (!words.length) return

      const tops = words.map((w) => w.offsetTop)
      // Group consecutive words into visual rows by offsetTop (1px tolerance);
      // each new row bumps the stagger index.
      const nextDelays: number[] = []
      let rowIdx = -1
      let prevTop = Number.NaN
      tops.forEach((t) => {
        if (Number.isNaN(prevTop) || Math.abs(t - prevTop) > 1) {
          rowIdx++
          prevTop = t
        }
        nextDelays.push(BASE_DELAY + rowIdx * stagger)
      })

      // Distinct rows per logical line, from each word's data-li.
      const rowsPerLine = new Array(lines.length).fill(0)
      const seen: Array<Set<number>> = lines.map(() => new Set<number>())
      words.forEach((w, i) => {
        const li = Number(w.dataset.li)
        if (seen[li]) seen[li].add(Math.round(tops[i]))
      })
      for (let li = 0; li < lines.length; li++) rowsPerLine[li] = seen[li].size || 1

      setDelays(nextDelays)
      setMaskRows(rowsPerLine)
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [lines, stagger])

  let flat = -1
  return (
    <h1 ref={headingRef} className={className}>
      {lines.map((line, lineIndex) => {
        const isLastLine = lineIndex === lines.length - 1
        // Mask (slide-up reveal) only on non-last lines that occupy a single
        // visual row. Wrapped lines render unmasked so they don't half-clip;
        // the last line is unmasked anyway (its blur halo must not be clipped).
        const singleRow = maskRows ? maskRows[lineIndex] === 1 : true
        const masked = !isLastLine && singleRow
        return (
          <span key={lineIndex} className={`block ${masked ? 'overflow-hidden' : ''}`}>
            {line.map((word, wordIndex) => {
              flat++
              return (
                <span key={wordIndex}>
                  {wordIndex > 0 && ' '}
                  <Word
                    text={word.text}
                    effect={word.effect}
                    delay={delays ? delays[flat] : null}
                    isLastInLine={wordIndex === line.length - 1}
                    reduce={reduce}
                    li={lineIndex}
                  />
                </span>
              )
            })}
          </span>
        )
      })}
    </h1>
  )
}

export default function Hero() {
  // Honor the OS "reduce motion" setting: the line slide becomes a gentle fade,
  // no transform. framer reads the same media query, so this stays in sync.
  const reduce = useReducedMotion() ?? false
  const locale = useLocale()
  const t = useTranslations('Home')

  let desktopLines = DESKTOP_LINES as HeroWord[][]
  let mobileLines = MOBILE_LINES as HeroWord[][]
  if (locale !== 'en') {
    const effects = [
      { phrase: t('heroWordIdentities'), effect: 'identities' },
      { phrase: t('heroWordPerceptions'), effect: 'perceptions' },
      { phrase: t('heroWordBold'), effect: 'bold' },
      { phrase: t('heroWordUnseen'), effect: 'unseen' },
    ]
    // A translated sentence can carry `|` to force a row break, the same
    // control the English arrays have. Without it the browser picks the wrap,
    // which can strand a word that belongs with the one before it.
    const rows = (line: string) =>
      line
        .split('|')
        .map((part) => splitWithEffects(part.trim(), effects))
        .filter((r) => r.length > 0)
    const one = rows(t('heroLine1'))
    const two = rows(t('heroLine2'))
    desktopLines = [...one, ...two]
    mobileLines = [...one, ...two]
  }

  return (
    <section className="px-[var(--gutter)] pt-[clamp(8rem,17vh,14rem)] pb-[var(--space-2xl)] landscape-short:pt-[5.5rem] landscape-short:pb-[var(--space-lg)]">
      {/* Desktop lines */}
      <AnimatedHeading
        lines={desktopLines}
        stagger={LINE_STAGGER_DESKTOP}
        reduce={reduce}
        className="hidden cursor-default select-none [-webkit-tap-highlight-color:transparent] font-display text-[clamp(3rem,8vw,7rem)] font-bold leading-[1.05] tracking-[-0.03em] md:block landscape-short:text-[2.75rem]"
      />

      {/* Mobile lines */}
      <AnimatedHeading
        lines={mobileLines}
        stagger={LINE_STAGGER_MOBILE}
        reduce={reduce}
        className="cursor-default select-none [-webkit-tap-highlight-color:transparent] font-display text-[clamp(3rem,12vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em] md:hidden"
      />
    </section>
  )
}
