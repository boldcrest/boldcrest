'use client'

import { useTranslations } from 'next-intl'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import StartProjectChat from './StartProjectChat'
import { useLenis } from '@/components/LenisProvider'
import { trackStartProject } from '@/lib/analytics'

type StartProjectContextValue = {
  isOpen: boolean
  open: () => void
  close: () => void
}

const StartProjectContext = createContext<StartProjectContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
})

export function useStartProject() {
  return useContext(StartProjectContext)
}

export default function StartProjectProvider({ children }: { children: ReactNode }) {
  const tc = useTranslations('Chat')
  const [isOpen, setIsOpen] = useState(false)
  const [chatKey, setChatKey] = useState(0)
  const open = useCallback(() => {
    setIsOpen(true)
    trackStartProject() // GA4 start_project_open + Meta custom 'StartProject'
  }, [])
  const close = useCallback(() => setIsOpen(false), [])
  // Remounting the chat with a fresh key resets it to the first question.
  const restartChat = useCallback(() => setChatKey((k) => k + 1), [])
  const lenis = useLenis()

  // Esc to close.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, close])

  // Lock background scroll with plain overflow:hidden — deliberately NOT the
  // position:fixed-body technique. Pinning <body> with position:fixed suppresses
  // iOS Safari's visualViewport keyboard resize (visualViewport.height stops
  // shrinking when the keyboard opens), which blinds all of our keyboard-aware
  // sizing/scrolling. We don't need the fixed-body trick anyway: the page
  // content is hidden while the chat is open (below), so there's nothing behind
  // the panel to bleed through even if the document shifts.
  useEffect(() => {
    if (!isOpen) return
    lenis?.stop()
    const body = document.body
    const prevOverflow = body.style.overflow
    const prevOverscroll = body.style.overscrollBehavior
    body.style.overflow = 'hidden'
    body.style.overscrollBehavior = 'none'
    return () => {
      body.style.overflow = prevOverflow
      body.style.overscrollBehavior = prevOverscroll
      lenis?.start()
    }
  }, [isOpen, lenis])

  // Hide the page content behind the overlay while the chat is open on
  // PHONE-sized touch screens only. There the panel is full-width and the
  // on-screen keyboard clips position:fixed elements to the visual viewport,
  // leaving a strip above the keyboard where the page bleeds through no matter
  // how we size the panel; making the page invisible fills that strip with the
  // uniform body background (#0a0a0a). visibility (not display:none) keeps
  // layout + scroll position intact.
  //
  // Tablets (iPad) and desktops do NOT hide the page — the panel is a side panel
  // there, so the rest of the site should stay visible behind the dimmed/blurred
  // backdrop (a solid-black left half looks broken). "Both sides >= 700px"
  // separates iPad (short side >= 744) from iPhone (short side <= ~430) in any
  // orientation, so the iPhone keyboard fix is left exactly as it was.
  const pageRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const el = pageRef.current
    const mm =
      typeof window.matchMedia === 'function' ? window.matchMedia.bind(window) : null
    const isTouch = mm ? mm('(pointer: coarse)').matches : false
    const isTablet = mm
      ? mm('(min-width: 700px) and (min-height: 700px)').matches
      : false
    if (!el || !isTouch || isTablet) return
    const prev = el.style.visibility
    el.style.visibility = 'hidden'
    return () => {
      el.style.visibility = prev
    }
  }, [isOpen])

  // Size + position the overlay (backdrop AND panel) to the visual viewport with
  // DIRECT DOM writes — not React state. State updates land a frame late, and
  // during the keyboard animation that one-frame lag is exactly when the page
  // flashes through. Writing top/height straight to the elements keeps the panel
  // pinned to the visible band above the keyboard every frame. Explicit pixel
  // height means the fixed panel covers exactly that band with no gap. With no
  // keyboard (desktop/iPad) this resolves to the full window.
  const panelRef = useRef<HTMLElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)

  // The panel (aside) must NEVER scroll — only the inner [data-lenis-prevent]
  // chat body does. But the aside is overflow-hidden, which still scrolls
  // programmatically: a focus()/scrollIntoView on a field bubbles a scroll all
  // the way up into the panel, shoving the header + conversation off the top and
  // leaving a large void below. Pin its scrollTop to 0 (initial + on any scroll)
  // so the panel chrome stays put no matter what tries to scroll it. Safe on all
  // devices — the panel is never meant to scroll on any of them.
  useEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    if (!panel) return
    const reset = () => {
      if (panel.scrollTop !== 0) panel.scrollTop = 0
      if (panel.scrollLeft !== 0) panel.scrollLeft = 0
    }
    reset()
    panel.addEventListener('scroll', reset, { passive: true })
    return () => panel.removeEventListener('scroll', reset)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const vv = window.visualViewport
    const apply = () => {
      const top = vv ? vv.offsetTop : 0
      const height = vv ? vv.height : window.innerHeight
      for (const el of [panelRef.current, backdropRef.current] as HTMLElement[]) {
        if (!el) continue
        el.style.top = `${top}px`
        el.style.height = `${height}px`
      }
    }
    apply()
    // Re-apply next frame too, in case the panel is still mounting/animating in.
    const raf = requestAnimationFrame(apply)
    vv?.addEventListener('resize', apply)
    vv?.addEventListener('scroll', apply)
    window.addEventListener('resize', apply)
    return () => {
      cancelAnimationFrame(raf)
      vv?.removeEventListener('resize', apply)
      vv?.removeEventListener('scroll', apply)
      window.removeEventListener('resize', apply)
    }
  }, [isOpen])

  return (
    <StartProjectContext.Provider value={{ isOpen, open, close }}>
      <div ref={pageRef}>{children}</div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop — darkened + blurred for the ENTIRE time the chat is
                open. A single stable layer that only fades on open/close, never
                toggling on focus/keyboard, so the page behind never flashes back
                into view. No box around the chat. */}
            <motion.div
              ref={backdropRef}
              // A LIGHT dim + gentle blur, just enough to pull focus to the chat
              // — not a heavy blackout. The blur only matters where the page
              // behind stays visible: desktop (fine pointer) AND tablets/iPad
              // (>= 700px on both sides). Phones hide the page, so blurring a
              // solid colour there would be wasted GPU — they get the dim only.
              // bg-black/40 reads as a soft dim over the visible page and as
              // near-black where the page is hidden (body is already #0a0a0a).
              className="fixed left-0 top-0 z-[1900] h-[100dvh] w-full bg-black/40 [@media(pointer:fine)]:backdrop-blur-[6px] [@media(min-width:700px)_and_(min-height:700px)]:backdrop-blur-[6px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              onClick={close}
            />

            {/* Side panel — top/height are written from the visual viewport (see
                effect above) so the panel covers exactly the visible band above
                the keyboard, with no gap for the page to bleed through. */}
            <motion.aside
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label={tc('newProject')}
              className="fixed right-0 top-0 z-[2000] flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-bg"
              style={{ borderLeft: '1px solid var(--border)', boxShadow: '-24px 0 60px rgba(0,0,0,0.45)' }}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Panel header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
                  {tc('newProject')}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={restartChat}
                    aria-label={tc('newConversation')}
                    title={tc('newConversation')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 hover:border-white/40"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M13.6 8A5.6 5.6 0 1 1 11.9 4.0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M13.8 2.2v2.4h-2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    onClick={close}
                    aria-label={tc('close')}
                    className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors duration-300 hover:border-white/40"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M3 3l10 10M13 3l-10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Scrollable chat body — keep Lenis out so it scrolls natively.
                  min-h-0 is essential: without it the flex item grows with its
                  content (and keyboard padding) and overflows the panel instead
                  of scrolling internally, which breaks the keyboard math. */}
              <div
                data-lenis-prevent
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pt-8 pb-6"
              >
                <StartProjectChat key={chatKey} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </StartProjectContext.Provider>
  )
}
