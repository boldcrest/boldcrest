'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import LocaleLink from './LocaleLink'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import MobileMenu from './MobileMenu'
import LanguageButton from './LanguageButton'
import { useStartProject } from './start-project/StartProjectProvider'
import { useFormEmbed } from '@/lib/embed'

// `key` indexes the Nav namespace in messages/*.json; the visible label comes
// from the catalogue so it follows the active locale.
const navLinks = [
  { href: '/work', key: 'work' },
  { href: '/services', key: 'services' },
  { href: '/people', key: 'people' },
  { href: '/diary', key: 'diary' },
  { href: '/contact', key: 'contact' },
] as const

export default function Header() {
  // Two independent scroll signals, OR'd together. Normal pages drive
  // `realScrolled` (window scroll); body-locked decks (People / diary single)
  // can't scroll the window, so they drive `virtualScrolled` via a `bc-scroll`
  // event instead. Keeping them separate stops a stray window scroll on a locked
  // page (e.g. iOS address-bar settle on the first swipe, scrollY back to 0) from
  // clobbering the virtual state and dropping the pill.
  const [realScrolled, setRealScrolled] = useState(false)
  const [virtualScrolled, setVirtualScrolled] = useState(false)
  const scrolled = realScrolled || virtualScrolled
  const [mobileOpen, setMobileOpen] = useState(false)
  const [vw, setVw] = useState(0)
  // The CTA's border is an inline style (it animates between the pill and the
  // compact "+"), so :hover can't reach it — track hover here the same way the
  // contact form's SEND pill does, and brighten the stroke to match the
  // language button beside it.
  const t = useTranslations('Nav')
  const [ctaHover, setCtaHover] = useState(false)
  // `auto` can be animated TO but not FROM, and it broke BOTH axes: collapsing,
  // the width snapped shut while expanding tweened; expanding, the height
  // snapped straight to the content height (35.2 -> 16.4px, since padding is
  // still 0 at that instant) and then grew back, so the pill visibly shrank
  // before reaching full size. Measure the label once and drive width AND
  // height with real lengths in both states. Falls back to `auto` until
  // measured, so SSR and first paint are unchanged.
  const ctaLabelRef = useRef<HTMLSpanElement>(null)
  const [ctaFull, setCtaFull] = useState<{ w: number; h: number } | null>(null)
  useEffect(() => {
    const measure = () => {
      const el = ctaLabelRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      // label box + the pill's padding (1.4rem across, 0.6rem down) + 1px border
      setCtaFull({ w: el.scrollWidth + 2 * 22.4 + 2, h: r.height + 2 * 9.6 + 2 })
    }
    measure()
    document.fonts?.ready.then(measure).catch(() => {})
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio')
  const { open: openStartProject } = useStartProject()
  // On a vanity form subdomain, relative links get rewritten back to the form,
  // so point the logo/nav at the absolute canonical site (empty base elsewhere).
  const { linkBase } = useFormEmbed()
  const embed = linkBase !== ''

  useEffect(() => {
    if (isStudio) return
    const onScroll = () => setRealScrolled(window.scrollY > 80)
    // Pages that lock body scroll (full-screen decks) emit a virtual scroll
    const onVirtual = (e: Event) =>
      setVirtualScrolled(((e as CustomEvent).detail?.scrollY ?? 0) > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('bc-scroll', onVirtual)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('bc-scroll', onVirtual)
    }
  }, [isStudio])

  useEffect(() => {
    setMobileOpen(false)
    setPillRevealed(true)
    setPillInstant(true)
  }, [pathname])

  // Resting-pill visibility, built so open and close are exact mirror images.
  // `pillOn` is computed at RENDER (not in an effect) so it flips in the SAME frame
  // as the panel mounts/unmounts — an effect runs a frame late, which leaves the
  // pill and the panel both visible for one frame and reads as a flash/double.
  // The pill is hidden the whole time the menu panel is on screen: while open
  // (mobileOpen) AND through the entire close collapse (pillRevealed stays false
  // until the panel has fully exited). `revealPill` — from MobileMenu's
  // onExitComplete — flips it back on the instant the panel is gone, so the pill
  // and panel never coexist (no blend, no dip, no double-darkening). `pillInstant`
  // makes the menu-driven swaps 0ms (they happen hidden behind the panel, incl.
  // the reveal exactly at panel-gone); a plain scroll keeps the gentle 200ms fade.
  const [pillRevealed, setPillRevealed] = useState(true)
  const [pillInstant, setPillInstant] = useState(false)
  const pillOn = scrolled && !mobileOpen && pillRevealed
  const openMenu = () => { setPillInstant(true); setMobileOpen(true) }
  const closeMenu = () => {
    if (mobileOpen) { setPillInstant(true); setPillRevealed(false) }
    setMobileOpen(false)
  }
  const revealPill = () => { setPillInstant(true); setPillRevealed(true) }
  // A plain scroll (menu not involved) fades the pill with the gentle 200ms curve.
  const mobileOpenRef = useRef(mobileOpen)
  mobileOpenRef.current = mobileOpen
  useEffect(() => {
    if (!mobileOpenRef.current) setPillInstant(false)
  }, [scrolled])

  // Track viewport width so the CTA can collapse to its compact "+" form
  // before it crowds the nav, and so the scrolled pill stays full-width on
  // mobile (matching the open menu panel).
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  if (isStudio) return null

  // Below md the hamburger/menu takes over. Between md and lg the full CTA
  // crowds the nav, so use the compact "+" there (and whenever scrolled).
  const isMobile = vw > 0 && vw < 768
  const ctaCompact = scrolled || (vw >= 768 && vw < 1024)

  return (
    <>
      {/* Frosted pill BACKGROUND — its own fixed layer at z-999, BELOW the mobile
          menu panel (z-1001). Kept separate from the header content (z-1002) on
          purpose: when the menu closes, this pill's opacity change happens HIDDEN
          behind the shrinking panel, so the pill is simply revealed when the panel
          unmounts — no visible "fade in from nowhere". Mirrors the pill wrapper's
          geometry + width animation so it stays perfectly aligned with the content. */}
      <div
        className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{ padding: '1rem var(--gutter)', height: '5rem', zIndex: 999 }}
        aria-hidden
      >
        <div
          style={{
            position: 'relative',
            width: scrolled && !isMobile ? 'min(56rem, 85%)' : '100%',
            height: '3.5rem',
            transition: 'width 650ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              borderRadius: '1.75rem',
              backgroundColor: 'rgba(10, 10, 10, 0.88)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              // Hidden while the menu is open (the panel is the surface then). The
              // fade to/from this state is invisible because it's behind the panel.
              boxShadow: pillOn ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
              opacity: pillOn ? 1 : 0,
              // `pillInstant` (0ms) is used for menu-driven swaps, which always
              // happen hidden behind the panel — so the pill switches on/off
              // invisibly and is simply revealed when the panel is gone. A plain
              // scroll uses the gentle 200ms fade.
              transition: pillInstant
                ? 'opacity 0ms, box-shadow 400ms ease-out'
                : 'opacity 200ms ease-out, box-shadow 400ms ease-out',
            }}
          />
        </div>
      </div>

      <header
        className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none"
        style={{
          padding: '1rem var(--gutter)',
          height: '5rem',
          // Always sit above the mobile menu overlay/panel (z-1000/1001) so the
          // header's own solid logo + morphing hamburger stay on top through the
          // ENTIRE open AND close. (If we dropped this on close, the still-exiting
          // panel would cover the solid logo/X for ~0.4s and read as a fade-out.)
          // Still below the cookie banner (1800), Start-a-Project (1900/2000),
          // page transition (9999) and loading screen, so nothing else regresses.
          zIndex: 1002,
        }}
      >
        {/* Pill wrapper — width animates */}
        <div
          className="relative flex items-center pointer-events-auto"
          style={{
            width: scrolled && !isMobile ? 'min(56rem, 85%)' : '100%',
            height: '3.5rem',
            transition: 'width 650ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {/* (Frosted pill background lives in its own z-999 layer above — see top
              of component — so it can sit below the menu panel.) */}

          {/* Inner content */}
          <div
            className="relative flex w-full items-center justify-between"
            style={{
              // Pad inward when scrolled OR when the mobile menu opens. The open
              // menu's logo/X are aligned to the scrolled-pill positions (inset by
              // this 1.25rem), so applying the same padding on open glides the
              // header's logo/hamburger to sit exactly under the menu's logo/X.
              padding: scrolled || mobileOpen ? '0 1.25rem' : '0',
              // Any menu-driven move (open AND close) uses the fast 420ms/ease-out-
              // expo timing so it stays locked to the menu logo's slide — a single
              // solid crest gliding 24↔44px, pure movement, no fade, no ghost. Only
              // the actual scroll→pill transition (scrolled with the menu closed)
              // uses the slower, springier pill timing.
              transitionProperty: 'padding',
              transitionDuration: scrolled && !mobileOpen ? '650ms' : '420ms',
              transitionTimingFunction:
                scrolled && !mobileOpen
                  ? 'cubic-bezier(0.23, 1, 0.32, 1)'
                  : 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Logo — goes home; if already home, smooth-scrolls to the top
                (and resets slide-deck pages) instead of doing nothing. */}
            <LocaleLink
              href="/"
              base={linkBase}
              aria-label={t('home')}
              className="z-10 flex items-center"
              // Anchors are natively draggable: a tap with a few px of finger/
              // mouse travel starts a link-drag and Chrome flashes its drag
              // ghost (URL pill + broken-image placeholder) over the menu.
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              // NOTE: the logo does NOT fade when the menu opens. Its position
              // matches the menu's logo, so keeping it solid makes the crest read
              // as one static logo through the open/close (only the hamburger↔X
              // crossfades). The menu's own logo fades in over this identical,
              // co-located crest, so total brightness stays ~constant.
              onClick={(e) => {
                // The header logo now sits above the open menu, so a tap on it
                // should also close the menu (the route effect handles it when we
                // actually navigate, but not when we're already home).
                closeMenu()
                if (!embed && pathname === '/') {
                  e.preventDefault()
                  window.dispatchEvent(new CustomEvent('boldcrest:back-to-top'))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }
              }}
            >
              {/* Logo sized to the "Start a Project" pill height on desktop
                  (1.6rem → 2.225rem, +39%); that same +39% is applied uniformly
                  across all breakpoints. */}
              <svg
                viewBox="0 0 384.09 384"
                aria-hidden="true"
                className="h-[2.225rem] w-[2.225rem]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="M321.01,81.6v-2.75c-.93-.36-1.75-.71-2.59-.99-8.55-2.85-17.11-5.71-25.67-8.52-26.48-8.7-52.96-17.4-79.43-26.11h0s-2.56-.84-2.56-.84l-11.78-3.92-6.23-2.08-2.65.89s0,0,0,0c-2.13.72-4.26,1.43-6.39,2.14h0s-14.07,4.73-14.07,4.73h-.02c-27.79,9.32-55.59,18.64-83.38,27.95-6.55,2.19-13.08,4.42-19.69,6.66v2.61c0,45.43.01,90.86,0,136.28,0,13.38,2.79,26.12,8.44,38.25,8.64,18.55,22.04,33.2,37.91,45.71,22.54,17.77,47.81,30.42,74.74,39.82,1.51.53,6.13,2.14,6.13,2.14l5.03-1.78c.5-.17,1-.34,1.51-.52,1.29-.45,2.58-.91,3.87-1.38,14.85-5.43,29.16-12.08,42.9-19.98,18.41-10.59,35.35-23.05,49.24-39.32,16.32-19.11,24.99-40.88,24.78-66.35-.37-44.22-.1-88.44-.1-132.66ZM297.55,238.3c-17.69-24.61-35.31-49.27-52.91-73.95-6.98-9.78-15.27-9.84-22.23-.1-15.56,21.78-31.08,43.6-46.75,65.3-5.93,8.2-13.86,8.15-19.82.08-4.45-6.01-8.72-12.16-13.05-18.25-7.01-9.85-15.04-9.91-22.15-.04-8.87,12.31-17.56,24.76-26.56,36.98-.39-.78-.78-1.57-1.15-2.36-4.8-10.3-7.17-21.12-7.17-32.48.02-38.57,0-77.15,0-115.72v-2.22c5.61-1.9,11.16-3.79,16.72-5.65,21.05-7.06,42.1-14.11,63.15-21.17h0s25.8-8.61,25.8-8.61l1.47-.49,108.92,35.99v2.33c0,37.55-.23,75.1.09,112.65.08,9.86-1.41,19.06-4.36,27.7Z"
                />
              </svg>
            </LocaleLink>

            {/* Desktop Nav — absolutely centered so the logo/CTA widths can't
                pull it off-center */}
            <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex">
              {navLinks.map((link) => (
                <LocaleLink
                  key={link.href}
                  href={link.href}
                  base={linkBase}
                  onClick={(e) => {
                    // Clicking the current page's nav item returns to the top
                    // (slide-deck pages reset their deck via the event).
                    if (!embed && pathname === link.href) {
                      e.preventDefault()
                      window.dispatchEvent(new CustomEvent('boldcrest:back-to-top'))
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                  // px/py enlarge the hit target (and absorb the inter-item gap) so
                  // the whole strip is clickable — the bare text box was a ~15px-tall
                  // target that was easy to miss. Padding is purely a hit area; the
                  // roll-up animation lives on the inner spans and is unaffected.
                  className={`group relative px-3 py-3 text-[0.8rem] font-medium uppercase tracking-[0.12em] transition-colors duration-[0.5s] ${
                    pathname === link.href
                      ? 'text-white'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                >
                  <span className="inline-flex overflow-hidden" style={{ height: '1.2em' }}>
                    <span
                      className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
                      style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                    >
                      <span className="leading-[1.2]">{t(link.key)}</span>
                      <span className="leading-[1.2]">{t(link.key)}</span>
                    </span>
                  </span>
                </LocaleLink>
              ))}
            </nav>

            {/* Right cluster — language switcher + CTA. Grouped in one flex box
                so the parent's justify-between still resolves to logo-left /
                cluster-right; as separate children it would space them out. */}
            <div className="hidden items-center gap-2 md:flex">
              <LanguageButton compact={ctaCompact} />

            {/* CTA — full text when not scrolled, circle + when scrolled */}
            <button
              type="button"
              onClick={openStartProject}
              onMouseEnter={() => setCtaHover(true)}
              onMouseLeave={() => setCtaHover(false)}
              className="group relative z-10 cursor-pointer inline-flex items-center justify-center overflow-hidden"
              style={{
                width: ctaCompact ? '2.2rem' : ctaFull ? `${ctaFull.w}px` : 'auto',
                height: ctaCompact ? '2.2rem' : ctaFull ? `${ctaFull.h}px` : 'auto',
                padding: ctaCompact ? '0' : '0.6rem 1.4rem',
                borderRadius: 'var(--radius-pill)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: ctaHover
                  ? 'rgba(255,255,255,0.6)'
                  : ctaCompact
                    ? 'rgba(255,255,255,0.35)'
                    : 'rgba(255,255,255,0.45)',
                backgroundColor: ctaCompact ? 'transparent' : '#000',
                // GEOMETRY MUST MATCH THE HEADER'S OWN 650ms. The cluster is
                // pulled right as this button narrows and pushed left as the
                // inner container's padding grows to 1.25rem; at 500ms vs
                // 650ms the width finished first, so both buttons shot ~5px
                // past their final position and drifted back — a visible
                // wobble. Same duration and curve for both movements makes the
                // combined travel monotonic. Colour stays at 500ms so hover
                // still matches the language button beside it.
                transition:
                  'width 650ms cubic-bezier(0.23, 1, 0.32, 1), height 650ms cubic-bezier(0.23, 1, 0.32, 1), padding 650ms cubic-bezier(0.23, 1, 0.32, 1), border-color 500ms cubic-bezier(0.23, 1, 0.32, 1), background-color 500ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-white/80 transition-all group-hover:text-white"
                style={{
                  opacity: ctaCompact ? 1 : 0,
                  transform: ctaCompact ? 'scale(1)' : 'scale(0.5)',
                  // Expanding, the + clears out fast and with no delay so it is
                  // gone before the label arrives — the two used to cross-fade
                  // on the same spot, leaving a ghost + over the emerging text.
                  // Collapsing it waits for the label to go and the pill to
                  // narrow before coming back.
                  transitionDuration: ctaCompact ? '260ms' : '140ms',
                  transitionDelay: ctaCompact ? '200ms' : '0ms',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>

              <span
                ref={ctaLabelRef}
                // whitespace-nowrap is load-bearing: the label is laid out at
                // its full width inside the 35px collapsed button, so without it
                // the text wraps to "Start" / "a Project" and the 1.2em clip
                // shows only the first line — the label appeared to glitch
                // through "Start" before snapping to the full words.
                className="relative z-10 inline-flex overflow-hidden whitespace-nowrap text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-text-secondary transition-all group-hover:text-white"
                style={{
                  // Height stays put. Animating it 0 -> 1.2em made the words
                  // unfold vertically while the pill was still narrow, so the
                  // text was squashed AND clipped horizontally (it is laid out
                  // at its full 131px from the first frame, inside a 35px
                  // button, and reads as growing out of its own middle).
                  height: '1.2em',
                  opacity: ctaCompact ? 0 : 1,
                  // Delayed past the width curve — which is front-loaded, ~98%
                  // done by 210ms — so the label only appears once there is a
                  // pill to sit in. Collapsing, it leaves immediately.
                  transitionProperty: 'opacity',
                  transitionDuration: ctaCompact ? '120ms' : '300ms',
                  transitionDelay: ctaCompact ? '0ms' : '200ms',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <span
                  className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                >
                  <span className="leading-[1.2]">{t('startProject')}</span>
                  <span className="leading-[1.2]">{t('startProject')}</span>
                </span>
              </span>
            </button>
            </div>

            {/* Mobile Hamburger ↔ X — ONE element that geometrically morphs (no
                fade). Two centred strokes: the top is full width; the bottom is
                short (scaleX 0.6, centred) so it reads as a hamburger. On open both
                converge to the centre and swing ±45° while the short stroke EXTENDS
                on both sides (scaleX → 1) into a clean, symmetric X. Because the
                header now sits above the open panel, this same element is what's
                visible open and closed — the morph is continuous, never a crossfade.
                top-[13px] centres each 2px stroke in the 28px box. */}
            <button
              className="relative z-10 h-7 w-7 md:hidden"
              onClick={() => (mobileOpen ? closeMenu() : openMenu())}
              aria-label={mobileOpen ? t('closeMenu') : t('toggleMenu')}
              style={{ marginRight: '7px' }}
            >
              <motion.span
                className="absolute right-0 top-[13px] h-[2px] w-7 rounded-[2px] bg-white"
                animate={mobileOpen ? { rotate: 45, y: 0 } : { rotate: 0, y: -3.5 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.span
                className="absolute right-0 top-[13px] h-[2px] w-7 origin-center rounded-[2px] bg-white"
                animate={mobileOpen ? { rotate: -45, y: 0, scaleX: 1 } : { rotate: 0, y: 3.5, scaleX: 0.6 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu
        open={mobileOpen}
        onClose={closeMenu}
        scrolled={scrolled}
        onExitComplete={revealPill}
      />
    </>
  )
}
