'use client'

import {
  createContext,
  useContext,
  useCallback,
  useRef,
  useState,
  useEffect,
  type ReactNode,
} from 'react'
import { useRouter, usePathname } from 'next/navigation'

const TransitionContext = createContext<{
  isTransitioning: boolean
}>({ isTransitioning: false })

export function usePageTransition() {
  return useContext(TransitionContext)
}

/* ── Timing (ms) ── */
const WIPE_IN = 380
const HOLD = 100
const WIPE_OUT = 350
const EASE = 'cubic-bezier(0.77, 0, 0.175, 1)'

export default function PageTransitionProvider({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const transitioning = useRef(false)
  const prevPathname = useRef(pathname)
  const readyForWipeOut = useRef(false)

  // ── Scroll behaviour across navigations ─────────────────────────────────
  // Forward navigation (link click / fresh load) always lands at the TOP of the
  // new page. Browser back/forward returns you to exactly where you left off.
  // Next + Lenis don't restore scroll on their own — Lenis re-initialises to 0
  // on the route remount — so we remember each history entry's scroll position
  // ourselves (keyed by full URL on `window.__scrollMem`) and re-apply it.
  const curUrlRef = useRef<string>('')

  // On back/forward: remember where we were on the page we're leaving (its scroll
  // is still current at popstate time) and flag the nav as a pop so the reset
  // below — and the matching one in LenisProvider — restore instead of top.
  useEffect(() => {
    const mem = ((window as any).__scrollMem ||= {})
    const onPop = () => {
      if (curUrlRef.current) mem[curUrlRef.current] = window.scrollY
      ;(window as any).__navIsPop = true
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // On every committed pathname change: forward → top; back/forward → restore the
  // remembered offset. The restore is re-asserted across a few frames because the
  // destination page's content (and therefore its scroll height) finishes laying
  // out slightly after this effect runs — otherwise a tall page can't yet reach
  // the saved offset and the browser clamps it short.
  useEffect(() => {
    const mem = ((window as any).__scrollMem ||= {})
    const key = window.location.pathname + window.location.search
    // A language switch re-renders the same page under a different route, so
    // hold the reader's position instead of snapping to the top. Cleared on a
    // delay, after the re-asserts below, so LenisProvider's own reset (which
    // may run either side of this one) sees it too.
    const localeY = (window as any).__localeSwitchY
    if (typeof localeY === 'number') {
      const hold = () => {
        window.scrollTo(0, localeY)
        if ((window as any).__lenis) (window as any).__lenis.scrollTo(localeY, { immediate: true })
      }
      hold()
      requestAnimationFrame(hold)
      setTimeout(hold, 90)
      setTimeout(hold, 220)
      setTimeout(() => { delete (window as any).__localeSwitchY }, 400)
    } else if ((window as any).__navIsPop) {
      const y = mem[key]
      if (typeof y === 'number') {
        const apply = () => {
          window.scrollTo(0, y)
          if ((window as any).__lenis) (window as any).__lenis.scrollTo(y, { immediate: true })
        }
        apply()
        requestAnimationFrame(apply)
        setTimeout(apply, 90)
        setTimeout(apply, 220)
      }
    } else {
      window.scrollTo(0, 0)
      if ((window as any).__lenis) {
        ;(window as any).__lenis.scrollTo(0, { immediate: true })
      }
    }
    curUrlRef.current = key
  }, [pathname])

  const navigate = useCallback(
    (href: string) => {
      if (href === pathname || transitioning.current) return

      // Remember where we are on the page we're leaving so browser-back returns
      // here, then mark this as a forward nav (the reset effects force top).
      ;((window as any).__scrollMem ||= {})[
        window.location.pathname + window.location.search
      ] = window.scrollY
      ;(window as any).__navIsPop = false

      transitioning.current = true
      readyForWipeOut.current = false
      setIsTransitioning(true)

      const overlay = overlayRef.current
      const logo = logoRef.current
      if (!overlay || !logo) return

      // Reset & show
      overlay.style.display = 'block'
      overlay.style.transformOrigin = 'bottom'
      overlay.style.transform = 'scaleY(0)'
      overlay.style.transition = 'none'
      logo.style.opacity = '0'
      logo.style.transform = 'translateY(20px) scale(0.9)'
      logo.style.transition = 'none'

      // Force reflow, then animate wipe-in
      void overlay.offsetHeight
      overlay.style.transition = `transform ${WIPE_IN}ms ${EASE}`
      overlay.style.transform = 'scaleY(1)'

      // Fade in logo early in the wipe so the crest still reads at this speed
      setTimeout(() => {
        logo.style.transition = `opacity 0.22s ease, transform 0.22s ease`
        logo.style.opacity = '1'
        logo.style.transform = 'translateY(0) scale(1)'
      }, WIPE_IN * 0.25)

      // After wipe fully covers screen, scroll to top and navigate
      setTimeout(() => {
        // Scroll to top while overlay covers the page
        window.scrollTo(0, 0)
        document.documentElement.scrollTop = 0
        document.body.scrollTop = 0

        // Mark ready — wipe-out will only happen after both
        // the pathname changes AND the hold period passes
        readyForWipeOut.current = true

        router.push(href)
      }, WIPE_IN)
    },
    [pathname, router],
  )

  // When pathname changes after a transition, wipe the overlay out
  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname

    if (!transitioning.current) return

    const overlay = overlayRef.current
    const logo = logoRef.current
    if (!overlay || !logo) return

    const timers: ReturnType<typeof setTimeout>[] = []

    // Ensure scroll is at top before revealing
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0

    const doWipeOut = () => {
      // Double-ensure scroll top before reveal
      window.scrollTo(0, 0)

      requestAnimationFrame(() => {
        // Fade out logo first
        logo.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
        logo.style.opacity = '0'
        logo.style.transform = 'translateY(-15px) scale(0.95)'

        // Then wipe out
        const t2 = setTimeout(() => {
          overlay.style.transformOrigin = 'top'
          overlay.style.transition = `transform ${WIPE_OUT}ms ${EASE}`
          overlay.style.transform = 'scaleY(0)'

          const t3 = setTimeout(() => {
            overlay.style.display = 'none'
            transitioning.current = false
            setIsTransitioning(false)
          }, WIPE_OUT + 20)
          timers.push(t3)
        }, 100)
        timers.push(t2)
      })
    }

    // Wait for hold period to ensure smooth experience
    const t1 = setTimeout(doWipeOut, HOLD)
    timers.push(t1)

    return () => timers.forEach(clearTimeout)
  }, [pathname])

  // Intercept clicks on internal links
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('http') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:')
      )
        return
      if (anchor.target === '_blank') return
      // Skip studio links
      if (href.startsWith('/studio')) return

      e.preventDefault()
      navigate(href)
    }

    // Capture phase: run BEFORE Next.js <Link>'s own onClick (which fires during
    // React's bubble-phase delegation). We preventDefault here so Link sees
    // `defaultPrevented` and skips its early navigation — otherwise Next would
    // navigate first and the new page would flash in beneath the overlay before
    // the wipe even starts. We do NOT stopPropagation, so other onClick handlers
    // (mobile-menu close, magnetic buttons) still run normally.
    document.addEventListener('click', handleClick, true)
    return () => document.removeEventListener('click', handleClick, true)
  }, [navigate])

  return (
    <TransitionContext.Provider value={{ isTransitioning }}>
      {children}
      {/* Transition overlay */}
      <div
        ref={overlayRef}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          backgroundColor: '#0a0a0a',
          transform: 'scaleY(0)',
          transformOrigin: 'bottom',
          display: 'none',
          pointerEvents: 'none',
        }}
      >
        {/* Centered logo / wordmark */}
        <div
          ref={logoRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0,
            transform: 'translateY(20px) scale(0.9)',
          }}
        >
          <svg
            viewBox="0 0 384.09 384"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="BoldCrest"
            style={{ width: 'clamp(3rem, 7vw, 4.5rem)', height: 'auto', color: '#545454' }}
          >
            <path
              fill="currentColor"
              d="M321.01,81.6v-2.75c-.93-.36-1.75-.71-2.59-.99-8.55-2.85-17.11-5.71-25.67-8.52-26.48-8.7-52.96-17.4-79.43-26.11h0s-2.56-.84-2.56-.84l-11.78-3.92-6.23-2.08-2.65.89s0,0,0,0c-2.13.72-4.26,1.43-6.39,2.14h0s-14.07,4.73-14.07,4.73h-.02c-27.79,9.32-55.59,18.64-83.38,27.95-6.55,2.19-13.08,4.42-19.69,6.66v2.61c0,45.43.01,90.86,0,136.28,0,13.38,2.79,26.12,8.44,38.25,8.64,18.55,22.04,33.2,37.91,45.71,22.54,17.77,47.81,30.42,74.74,39.82,1.51.53,6.13,2.14,6.13,2.14l5.03-1.78c.5-.17,1-.34,1.51-.52,1.29-.45,2.58-.91,3.87-1.38,14.85-5.43,29.16-12.08,42.9-19.98,18.41-10.59,35.35-23.05,49.24-39.32,16.32-19.11,24.99-40.88,24.78-66.35-.37-44.22-.1-88.44-.1-132.66ZM297.55,238.3c-17.69-24.61-35.31-49.27-52.91-73.95-6.98-9.78-15.27-9.84-22.23-.1-15.56,21.78-31.08,43.6-46.75,65.3-5.93,8.2-13.86,8.15-19.82.08-4.45-6.01-8.72-12.16-13.05-18.25-7.01-9.85-15.04-9.91-22.15-.04-8.87,12.31-17.56,24.76-26.56,36.98-.39-.78-.78-1.57-1.15-2.36-4.8-10.3-7.17-21.12-7.17-32.48.02-38.57,0-77.15,0-115.72v-2.22c5.61-1.9,11.16-3.79,16.72-5.65,21.05-7.06,42.1-14.11,63.15-21.17h0s25.8-8.61,25.8-8.61l1.47-.49,108.92,35.99v2.33c0,37.55-.23,75.1.09,112.65.08,9.86-1.41,19.06-4.36,27.7Z"
            />
          </svg>
        </div>
      </div>
    </TransitionContext.Provider>
  )
}
