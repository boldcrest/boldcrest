'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'

/**
 * Two-letter language switcher that sits beside the header CTA.
 *
 * It mirrors the CTA's OWN two states rather than picking one: at rest it wears
 * the "Start a Project" pill's skin (solid black, 0.45 border) so the pair reads
 * as one control, and when the header collapses it switches to the compact "+"
 * skin (0.08 fill, 0.35 border) so it stays the +'s twin. `compact` is the
 * header's `ctaCompact`, so the two always change together.
 *
 * Opening grows ONE body downward instead of dropping a detached panel (the
 * jokadent LanguageMenu approach): a column the width of the circle, carrying
 * the same fill and border, animates its HEIGHT from one circle to one-per-
 * locale, and the button on top drops its own fill and border while open so the
 * column shows through as its top. Two overlapping fills would read as a
 * brighter, offset edge — hence the swap rather than stacking.
 *
 * PREVIEW ONLY — there is no i18n layer yet (no locale routing, no message
 * catalogue, no locale fields in Sanity, and layout.tsx hardcodes lang="en"),
 * so choosing a language only changes this label. Deliberately inert rather
 * than half-wired.
 *
 * CODES: Albanian shows as "AL" because that is what local visitors read, but
 * its real language code is "sq" ("al" is the COUNTRY code). `code` holds the
 * ISO value a real implementation must put in the URL and <html lang>; only
 * `label` is display text.
 */
export const LOCALES = [
  { code: 'en', label: 'EN', name: 'English' },
  // { code: 'sq', label: 'AL', name: 'Shqip' } — switched off for now, see i18n/routing.ts
  { code: 'it', label: 'IT', name: 'Italiano' },
  { code: 'fr', label: 'FR', name: 'Français' },
] as const

export type Locale = (typeof LOCALES)[number]

const UNIT = 2.2 // rem — the compact CTA's diameter
const CIRCLE = `${UNIT}rem`
const EASE = 'cubic-bezier(0.76, 0, 0.24, 1)'

export default function LanguageButton({ compact }: { compact: boolean }) {
  const tl = useTranslations('Language')
  const activeLocale = useLocale()
  const current: Locale =
    LOCALES.find((l) => l.code === activeLocale) ?? LOCALES[0]
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const switchTo = (next: Locale) => {
    // Read straight off the browser rather than useSearchParams(): the hook
    // forces a Suspense boundary in every statically prerendered page, and the
    // switcher renders in the header on all of them. We only need the query at
    // click time anyway.
    const { search, hash } = typeof window !== 'undefined'
      ? window.location
      : { search: '', hash: '' }
    // A language switch is the SAME page in another language, so it must not
    // behave like a navigation: keep the reader exactly where they were.
    // The route still changes (/work -> /fr/work), and both scroll resets key
    // off `__navIsPop`, so flag this nav explicitly for them to honour.
    ;(window as unknown as { __localeSwitchY?: number }).__localeSwitchY =
      window.scrollY
    startTransition(() => {
      router.replace(`${pathname}${search}${hash}`, {
        locale: next.code,
        scroll: false,
      })
    })
  }

  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(false)
  // The circle must stay edgeless for the WHOLE retract, not just while `open`:
  // its border is a full circle, so the moment it returns it draws a line
  // straight across the still-open column. `retracting` holds it hidden for the
  // 420ms shrink; `snap` then restores it with no transition, so it reappears
  // exactly as the column vanishes instead of fading in over an edgeless gap.
  const [retracting, setRetracting] = useState(false)
  const [snap, setSnap] = useState(false)
  const timers = useRef<number[]>([])
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const toggle = (next: boolean) => {
    if (!next && open) {
      setRetracting(true)
      timers.current.push(
        window.setTimeout(() => {
          setRetracting(false)
          setSnap(true)
          timers.current.push(window.setTimeout(() => setSnap(false), 60))
        }, 420),
      )
    }
    setOpen(next)
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) toggle(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && toggle(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Collapsing the header while the menu is open would leave the column wearing
  // the wrong skin mid-animation — just close it.
  useEffect(() => setOpen(false), [compact])  // a skin change mid-open would look wrong; just drop it

  const others = LOCALES.filter((l) => l.code !== current.code)
  const expanded = open || retracting

  // The CTA's two skins, matched exactly (measured off the live button).
  // Compact, the FILL is transparent so the frosted pill shows through
  // untouched — the circle reads as stroke only, exactly the pill's colour,
  // rather than the slightly lighter disc a 0.08 white wash produced.
  const fill = compact ? 'transparent' : 'rgba(10,10,10,0.72)'
  const glass = compact ? 'none' : 'blur(24px) saturate(1.5)'
  const edge = compact ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.45)'
  const ink = compact ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'

  // The COLUMN can't be transparent: it hangs BELOW the pill, over live page
  // content. It carries the pill's own frosted fill so the part that overhangs
  // looks like a continuation of the pill rather than a window onto the page.
  const columnBg = compact ? 'rgba(10,10,10,0.88)' : 'rgba(10,10,10,0.88)'
  const columnBlur = compact ? 'blur(24px) saturate(1.5)' : 'none'

  return (
    <div ref={root} className="relative" style={{ width: CIRCLE, height: CIRCLE }}>
      {/* The body. Opening and closing are the same move in reverse: the height
          animation does all the work in both directions and the column stays
          fully opaque throughout, so it retracts into the circle rather than
          vanishing. Opacity is a hard cut, never a fade — it flips on instantly
          when opening, and when closing it waits out the full 420ms shrink
          (`0s linear 420ms`) before flipping off, so it disappears exactly as
          it reaches circle size. It must disappear: closed, the column's own
          border would otherwise sit under the button's and read as a brighter
          double ring. */}
      <ul
        role="listbox"
        aria-label={tl('label')}
        className="absolute left-0 top-0 overflow-hidden"
        style={{
          width: CIRCLE,
          height: `${open ? UNIT * (1 + others.length) : UNIT}rem`,
          paddingTop: CIRCLE,
          borderRadius: 'var(--radius-pill)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: edge,
          backgroundColor: columnBg,
          backdropFilter: columnBlur,
          WebkitBackdropFilter: columnBlur,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: `height 420ms ${EASE}, opacity ${open ? '0s linear' : '0s linear 420ms'}, background-color 500ms cubic-bezier(0.23,1,0.32,1), border-color 500ms cubic-bezier(0.23,1,0.32,1)`,
          zIndex: 20,
        }}
      >
        {others.map((l) => (
          <LocaleOption
            key={l.code}
            locale={l}
            open={open}
            onSelect={() => {
              switchTo(l)
              toggle(false)
            }}
          />
        ))}
      </ul>

      {/* The circle. Open, it drops its own fill and border and lets the column
          be the body — no second edge over the first. */}
      <button
        type="button"
        onClick={() => toggle(!open)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label={`Language: ${current.name}. Change language`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="absolute left-0 top-0 inline-flex cursor-pointer items-center justify-center text-[0.7rem] font-semibold uppercase"
        style={{
          width: CIRCLE,
          height: CIRCLE,
          padding: 0,
          letterSpacing: '0.06em',
          borderRadius: 'var(--radius-pill)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: expanded ? 'transparent' : hover ? 'rgba(255,255,255,0.6)' : edge,
          backgroundColor: expanded ? 'transparent' : fill,
          backdropFilter: expanded ? 'none' : glass,
          WebkitBackdropFilter: expanded ? 'none' : glass,
          color: hover || expanded ? '#fff' : ink,
          transitionProperty: 'color, border-color, background-color',
          // 500ms matches the CTA's hover brightening; 0s only while the column
          // owns the edge, and for the one frame it hands it back.
          transitionDuration: expanded || snap ? '0s' : '500ms',
          transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
          zIndex: 21,
        }}
      >
        {/* Label rolls up on hover exactly as "Start a Project" does: the text
            twice in a column, clipped to one line, shifted -50% on hover — and
            ONLY in the full state. Collapsed, this button is the +'s twin, and
            the + has no text to roll, so a rolling EN beside a static + would
            break the pair. Gated on `!compact`, not removed, so the roll comes
            straight back when the header expands. */}
        <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
          <span
            className="flex flex-col"
            style={{
              transform: hover && !compact ? 'translateY(-50%)' : 'translateY(0)',
              transition: 'transform 0.5s cubic-bezier(0.645, 0.045, 0.355, 1)',
            }}
          >
            <span className="leading-[1.2]" translate="no">{current.label}</span>
            <span className="leading-[1.2]" translate="no">{current.label}</span>
          </span>
        </span>
      </button>
    </div>
  )
}

function LocaleOption({
  locale,
  open,
  onSelect,
}: {
  locale: Locale
  open: boolean
  onSelect: () => void
}) {
  const [hover, setHover] = useState(false)
  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={false}
        aria-label={locale.name}
        lang={locale.code}
        tabIndex={open ? 0 : -1}
        onClick={onSelect}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        // Hovered, only the letters change colour — no shape behind them and no
        // roll-up, so the column stays one clean body and the effect is
        // reserved for the main button in its full state.
        className="inline-flex cursor-pointer items-center justify-center text-[0.7rem] font-semibold uppercase"
        style={{
          width: CIRCLE,
          height: CIRCLE,
          padding: 0,
          letterSpacing: '0.06em',
          background: 'transparent',
          border: 'none',
          color: hover ? '#fff' : 'rgba(255,255,255,0.55)',
          opacity: open ? 1 : 0,
          transition: 'color 200ms ease, opacity 300ms ease',
          transitionDelay: open ? '0.12s' : '0s',
        }}
      >
        <span translate="no">{locale.label}</span>
      </button>
    </li>
  )
}
