'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import MobileMenu from './MobileMenu'

const navLinks = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/people', label: 'People' },
  { href: '/diary', label: 'Diary' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const isStudio = pathname?.startsWith('/studio')

  useEffect(() => {
    if (isStudio) return
    const onScroll = () => setScrolled(window.scrollY > 80)
    // Pages that lock body scroll (full-screen decks) emit a virtual scroll
    const onVirtual = (e: Event) =>
      setScrolled(((e as CustomEvent).detail?.scrollY ?? 0) > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('bc-scroll', onVirtual)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('bc-scroll', onVirtual)
    }
  }, [isStudio])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (isStudio) return null

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-[1000] flex justify-center pointer-events-none" style={{ padding: '1rem var(--gutter)', height: '5rem' }}>
        {/* Pill wrapper — width animates */}
        <div
          className="relative flex items-center pointer-events-auto"
          style={{
            width: scrolled ? 'min(56rem, 85%)' : '100%',
            height: '3.5rem',
            transition: 'width 650ms cubic-bezier(0.23, 1, 0.32, 1)',
          }}
        >
          {/* Frosted glass background — fades in separately */}
          <div
            className="absolute inset-0 z-[-1]"
            style={{
              borderRadius: '1.75rem',
              backgroundColor: 'rgba(10, 10, 10, 0.88)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: scrolled ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
              opacity: scrolled ? 1 : 0,
              transition: 'opacity 200ms ease-out, box-shadow 400ms ease-out',
            }}
          />

          {/* Inner content */}
          <div
            className="flex w-full items-center justify-between transition-[padding] duration-[650ms]"
            style={{
              padding: scrolled ? '0 1.25rem' : '0',
              transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {/* Logo */}
            <Link href="/" className="z-10 flex items-center">
              <svg
                viewBox="0 0 384.09 384"
                className="h-[1.6rem] w-[1.6rem]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill="currentColor"
                  d="M321.01,81.6v-2.75c-.93-.36-1.75-.71-2.59-.99-8.55-2.85-17.11-5.71-25.67-8.52-26.48-8.7-52.96-17.4-79.43-26.11h0s-2.56-.84-2.56-.84l-11.78-3.92-6.23-2.08-2.65.89s0,0,0,0c-2.13.72-4.26,1.43-6.39,2.14h0s-14.07,4.73-14.07,4.73h-.02c-27.79,9.32-55.59,18.64-83.38,27.95-6.55,2.19-13.08,4.42-19.69,6.66v2.61c0,45.43.01,90.86,0,136.28,0,13.38,2.79,26.12,8.44,38.25,8.64,18.55,22.04,33.2,37.91,45.71,22.54,17.77,47.81,30.42,74.74,39.82,1.51.53,6.13,2.14,6.13,2.14l5.03-1.78c.5-.17,1-.34,1.51-.52,1.29-.45,2.58-.91,3.87-1.38,14.85-5.43,29.16-12.08,42.9-19.98,18.41-10.59,35.35-23.05,49.24-39.32,16.32-19.11,24.99-40.88,24.78-66.35-.37-44.22-.1-88.44-.1-132.66ZM297.55,238.3c-17.69-24.61-35.31-49.27-52.91-73.95-6.98-9.78-15.27-9.84-22.23-.1-15.56,21.78-31.08,43.6-46.75,65.3-5.93,8.2-13.86,8.15-19.82.08-4.45-6.01-8.72-12.16-13.05-18.25-7.01-9.85-15.04-9.91-22.15-.04-8.87,12.31-17.56,24.76-26.56,36.98-.39-.78-.78-1.57-1.15-2.36-4.8-10.3-7.17-21.12-7.17-32.48.02-38.57,0-77.15,0-115.72v-2.22c5.61-1.9,11.16-3.79,16.72-5.65,21.05-7.06,42.1-14.11,63.15-21.17h0s25.8-8.61,25.8-8.61l1.47-.49,108.92,35.99v2.33c0,37.55-.23,75.1.09,112.65.08,9.86-1.41,19.06-4.36,27.7Z"
                />
              </svg>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden items-center gap-6 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative text-[0.8rem] font-medium uppercase tracking-[0.12em] transition-colors duration-[0.5s] ${
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
                      <span className="leading-[1.2]">{link.label}</span>
                      <span className="leading-[1.2]">{link.label}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </nav>

            {/* CTA — full text when not scrolled, circle + when scrolled */}
            <Link
              href="/start-a-new-project"
              className="group relative z-10 hidden items-center justify-center overflow-hidden border transition-all md:inline-flex"
              style={{
                width: scrolled ? '2.2rem' : 'auto',
                height: scrolled ? '2.2rem' : 'auto',
                padding: scrolled ? '0' : '0.6rem 1.4rem',
                borderRadius: 'var(--radius-pill)',
                borderColor: scrolled ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.25)',
                backgroundColor: scrolled ? 'rgba(255,255,255,0.08)' : '#000',
                transitionDuration: '500ms',
                transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <span
                className="absolute inset-0 flex items-center justify-center text-[1rem] leading-none font-light text-white/80 transition-all group-hover:text-white"
                style={{
                  opacity: scrolled ? 1 : 0,
                  transform: scrolled ? 'scale(1)' : 'scale(0.5)',
                  transitionDuration: '400ms',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                +
              </span>

              <span
                className="relative z-10 inline-flex overflow-hidden text-[0.75rem] font-semibold uppercase tracking-[0.12em] text-text-secondary transition-all group-hover:text-white"
                style={{
                  height: scrolled ? 0 : '1.2em',
                  opacity: scrolled ? 0 : 1,
                  transitionDuration: '400ms',
                  transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)',
                }}
              >
                <span
                  className="flex flex-col transition-transform duration-[0.5s] group-hover:-translate-y-1/2"
                  style={{ transitionTimingFunction: 'cubic-bezier(0.645, 0.045, 0.355, 1)' }}
                >
                  <span className="leading-[1.2]">Start a Project</span>
                  <span className="leading-[1.2]">Start a Project</span>
                </span>
              </span>
            </Link>

            {/* Mobile Hamburger */}
            <button
              className="z-10 flex flex-col gap-[5px] md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="h-[2px] w-7 rounded-[2px] bg-white transition-all duration-[0.4s]"
                style={{
                  transform: mobileOpen ? 'rotate(45deg) translateY(3.5px)' : 'none',
                  transitionTimingFunction: 'var(--ease-out-expo)',
                }}
              />
              <span
                className="h-[2px] rounded-[2px] bg-white transition-all duration-[0.4s]"
                style={{
                  width: mobileOpen ? '28px' : '60%',
                  marginLeft: mobileOpen ? '0' : 'auto',
                  transform: mobileOpen ? 'rotate(-45deg) translateY(-3.5px)' : 'none',
                  transitionTimingFunction: 'var(--ease-out-expo)',
                }}
              />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}
