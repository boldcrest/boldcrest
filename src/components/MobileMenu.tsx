'use client'

import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useStartProject } from './start-project/StartProjectProvider'

const navLinks = [
  { href: '/work', label: 'Work' },
  { href: '/services', label: 'Services' },
  { href: '/people', label: 'People' },
  { href: '/diary', label: 'Diary' },
  { href: '/contact', label: 'Contact' },
]

interface MobileMenuProps {
  open: boolean
  onClose: () => void
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  const { open: openStartProject } = useStartProject()
  return (
    <AnimatePresence>
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
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0, 0, 0.2, 1] }}
            className="fixed left-[var(--gutter)] right-[var(--gutter)] top-4 z-[1001] overflow-clip rounded-[1.75rem]"
            style={{
              backgroundColor: 'rgba(10, 10, 10, 0.88)',
              backdropFilter: 'blur(24px) saturate(1.5)',
              WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Header row inside the menu — logo + close */}
            <div className="flex items-center justify-between px-5 h-14">
              <Link href="/" onClick={onClose}>
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
              <button onClick={onClose} aria-label="Close menu" className="flex flex-col gap-[5px]">
                <span className="h-[2px] w-7 rounded-[2px] bg-white transition-transform duration-300" style={{ transform: 'rotate(45deg) translateY(3.5px)' }} />
                <span className="h-[2px] w-7 rounded-[2px] bg-white transition-transform duration-300" style={{ transform: 'rotate(-45deg) translateY(-3.5px)' }} />
              </button>
            </div>

            {/* Links */}
            <ul className="flex flex-col gap-1 pt-2" style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 20 }}>
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.05 + i * 0.04,
                    ease: [0, 0, 0.2, 1],
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className="block py-0.5 font-display text-[2rem] font-normal leading-[1.2] text-white/60 transition-colors duration-200 hover:text-white"
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}

              {/* Start a Project — opens the chat panel */}
              <motion.li
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 + navLinks.length * 0.04, ease: [0, 0, 0.2, 1] }}
              >
                <button
                  type="button"
                  onClick={() => { onClose(); openStartProject() }}
                  className="block py-0.5 text-left font-display text-[2rem] font-normal leading-[1.2] text-white transition-colors duration-200 hover:text-accent"
                >
                  Start a Project
                </button>
              </motion.li>
            </ul>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  )
}
