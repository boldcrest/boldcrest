'use client'

import LocaleLink from './LocaleLink'
import { motion, AnimatePresence } from 'framer-motion'
import { useStartProject } from './start-project/StartProjectProvider'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '@/i18n/navigation'
import { LOCALES, type Locale } from './LanguageButton'
import { useFormEmbed } from '@/lib/embed'

const navLinks = [
  { href: '/work', key: 'work' },
  { href: '/services', key: 'services' },
  { href: '/people', key: 'people' },
  { href: '/diary', key: 'diary' },
  { href: '/contact', key: 'contact' },
] as const

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  // Whether the header is in its scrolled/pill state. When scrolled, the menu
  // panel is geometrically identical to (and co-located with) the frosted pill,
  // so it EXPANDS out of the pill height (no fade) for a seamless morph; from the
  // top there's no pill, so it just unrolls from 0.
  scrolled?: boolean
  // Fired once the panel has FULLY exited/unmounted. Header uses this to reveal
  // the resting pill at the exact moment this panel is gone, so the two surfaces
  // never overlap (no blend, no double-darkening) during a scrolled close.
  onExitComplete?: () => void
}

export default function MobileMenu({ open, onClose, scrolled = false, onExitComplete }: MobileMenuProps) {
  const { open: openStartProject } = useStartProject()
  // Reads the ACTIVE locale from the router, exactly as the header switcher
  // does — no local state, so the two can never disagree.
  const t = useTranslations('Nav')
  const tl = useTranslations('Language')
  const activeLocale = useLocale()
  const lang: Locale = LOCALES.find((l) => l.code === activeLocale) ?? LOCALES[0]
  const router = useRouter()
  const pathname = usePathname()

  // Same path, different locale — the visitor stays where they are.
  const switchTo = (next: Locale) => {
    // Read straight off the browser rather than useSearchParams(): the hook
    // forces a Suspense boundary in every statically prerendered page, and the
    // switcher renders in the header on all of them. We only need the query at
    // click time anyway.
    const { search, hash } = typeof window !== 'undefined'
      ? window.location
      : { search: '', hash: '' }
    // Keep the reader in place across a language switch — see LanguageButton.
    ;(window as unknown as { __localeSwitchY?: number }).__localeSwitchY =
      window.scrollY
    router.replace(`${pathname}${search}${hash}`, {
      locale: next.code,
      scroll: false,
    })
    onClose()
  }
  // On a vanity form subdomain, point links at the absolute canonical site so
  // they escape the form (relative paths get rewritten back to it).
  const { linkBase } = useFormEmbed()
  return (
    <AnimatePresence onExitComplete={onExitComplete}>
      {open && (
        <>
          {/* Blurred overlay behind menu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed inset-0 z-[1000]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
          />

          {/* Menu panel — frosted glass dropdown */}
          <motion.nav
            // Pure GEOMETRIC expansion — NO opacity fade (the fade read as a glitch
            // against the frosted pill). When scrolled, the panel starts at the pill
            // height (3.5rem) and, being visually identical and co-located with the
            // pill, simply grows downward — the pill appears to expand into the menu.
            // From the top there's no pill, so it unrolls from 0. The header's solid
            // logo + morphing hamburger ride above, so nothing needs to fade.
            // Close is the EXACT geometric REVERSE of open: the panel stays the one
            // solid 0.88 surface and simply shrinks back to the pill height (no bg
            // crossfade — that introduced a lightening dip that read as a glitch and
            // never matched the single-layer open). The separate header pill (z-999)
            // stays HIDDEN through the whole collapse and is only revealed once this
            // panel has fully unmounted (Header's onExitComplete), so there are never
            // two translucent layers blending at once. From the top there's no pill,
            // so we collapse to 0 and fade the panel out (kills the lingering border).
            initial={{ height: scrolled ? '3.5rem' : 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: scrolled ? '3.5rem' : 0, opacity: scrolled ? 1 : 0 }}
            transition={{
              height: { duration: 0.42, ease: [0.16, 1, 0.3, 1] },
              opacity: { duration: 0.3, ease: 'easeOut' },
            }}
            className="fixed left-[var(--gutter)] right-[var(--gutter)] top-4 z-[1001] overflow-clip rounded-[1.75rem]"
            style={{
              transformOrigin: 'top',
              backgroundColor: 'rgba(10, 10, 10, 0.88)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              // Longhand (not the `border` shorthand): framer-motion writes longhand
              // style props onto this element, and mixing shorthand + longhand makes
              // React warn about conflicting style updates on rerender.
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            {/* Spacer for the header zone. The logo and the hamburger↔X now live in
                the real <Header>, which is raised above this panel while open — so
                this panel renders no logo/X of its own (no duplicates, no crossfade).
                This empty row just reserves the same height so the nav starts below
                the floating header logo/X. */}
            <div className="h-[3.5rem]" aria-hidden />

            {/* Links */}
            <ul className="flex flex-col gap-1" style={{ paddingTop: 20, paddingLeft: 26, paddingRight: 26, paddingBottom: 24 }}>
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: 0.08 + i * 0.045,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                >
                  <LocaleLink
                    href={link.href}
                    base={linkBase}
                    onClick={onClose}
                    className="block py-0.5 font-display text-[1.85rem] font-normal leading-[1.2] text-white/60 transition-colors duration-200 hover:text-white"
                  >
                    {t(link.key)}
                  </LocaleLink>
                </motion.li>
              ))}

              {/* Start a Project — opens the chat panel */}
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + navLinks.length * 0.045, ease: [0.16, 1, 0.3, 1] }}
              >
                <button
                  type="button"
                  onClick={() => { onClose(); openStartProject() }}
                  className="flex w-full items-center justify-between gap-3 py-0.5 text-left font-display text-[1.85rem] font-normal leading-[1.2] text-white transition-colors duration-200 hover:text-accent"
                >
                  {t('startProject')}
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/35">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>
              </motion.li>

              {/* Language — a segmented pill rather than the header's dropdown.
                  There is room here, and a popup inside a panel that is itself
                  animating its height is fragile. Ruled off as a utility control
                  so it doesn't read as a sixth navigation item. */}
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 + (navLinks.length + 1) * 0.045, ease: [0.16, 1, 0.3, 1] }}
                className="mt-5 border-t pt-5"
                style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              >
                <div
                  role="group"
                  aria-label={tl('label')}
                  className="inline-flex h-9 items-center rounded-full border border-white/35 p-[3px]"
                >
                  {LOCALES.map((l) => {
                    const active = l.code === lang.code
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => switchTo(l)}
                        aria-pressed={active}
                        aria-label={l.name}
                        lang={l.code}
                        className="flex h-[28px] min-w-[42px] items-center justify-center rounded-full px-2 text-[0.7rem] font-semibold uppercase transition-colors duration-200"
                        style={{
                          letterSpacing: '0.06em',
                          backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'transparent',
                          color: active ? '#fff' : 'rgba(255,255,255,0.55)',
                        }}
                      >
                        <span translate="no">{l.label}</span>
                      </button>
                    )
                  })}
                </div>
              </motion.li>
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
