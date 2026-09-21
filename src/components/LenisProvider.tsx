'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

const LenisContext = createContext<Lenis | null>(null)

export function useLenis() {
  return useContext(LenisContext)
}

export default function LenisProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)
  const [lenis, setLenis] = useState<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Sanity Studio (/studio) manages scrolling inside its own panes. Lenis
    // hijacks wheel/trackpad events for smooth page-scroll, which stops the
    // Studio document pane from scrolling — so skip it entirely under /studio.
    if (pathname?.startsWith('/studio')) return

    // Disable Lenis on mobile for better native scroll performance
    const isMobile = window.innerWidth < 768
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (isMobile || prefersReduced) return

    // On a client route change this effect re-runs, and a fresh Lenis instance
    // reads window.scrollY at construction. If you navigated while the previous
    // page's Lenis was still mid-scroll, that value is a stale mid-page position
    // and the new page would "open from the middle" — so pin the window to the
    // top first. EXCEPT on browser back/forward (popstate), where the user
    // expects to land exactly where they left off: there we leave the restored
    // scroll position alone. (`__navIsPop` is set by the popstate listener in
    // PageTransition and reset on the next forward navigation.)
    // A locale switch keeps its position (see PageTransition) — don't zero it.
    if (typeof (window as any).__localeSwitchY === 'number') {
      // position is re-asserted by PageTransition; nothing to do here
    } else if (!(window as any).__navIsPop) {
      window.scrollTo(0, 0)
    }

    const instance = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
    })

    lenisRef.current = instance
    ;(window as any).__lenis = instance
    setLenis(instance)

    function raf(time: number) {
      instance.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      instance.destroy()
      lenisRef.current = null
      delete (window as any).__lenis
    }
  }, [pathname])

  return (
    <LenisContext.Provider value={lenis}>
      {children}
    </LenisContext.Provider>
  )
}
