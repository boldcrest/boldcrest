'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const serviceLinks = [
  { label: 'Branding', href: '/work?service=Branding' },
  { label: 'Packaging', href: '/work?service=Packaging+Design' },
  { label: 'Photography', href: '/work?service=Photography' },
  { label: 'Videography', href: '/work?service=Videography' },
  { label: 'Creative Advertising', href: '/work?service=Creative+Advertising' },
  { label: 'Social Media', href: '/work?service=Social+Media+Management' },
]

const companyLinks = [
  { label: 'Work', href: '/work' },
  { label: 'Services', href: '/services' },
  { label: 'People', href: '/people' },
  { label: 'Diary', href: '/diary' },
  { label: 'Contact', href: '/contact' },
]

const socialLinks = [
  { label: 'LinkedIn', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Behance', href: '#' },
  { label: 'Vimeo', href: '#' },
  { label: 'Facebook', href: '#' },
]

const linkClass = 'block py-1.5 text-[0.85rem] transition-colors duration-300 text-black/50 hover:text-black'

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export default function Footer() {
  const pathname = usePathname()

  if (pathname?.startsWith('/studio')) return null

  return (
    <footer
      className="flex flex-col"
      style={{ background: '#EDEDED', color: '#000000' }}
    >
        {/* Columns + Back to top */}
        <div className="w-full px-[var(--gutter)] pt-14 pb-20">
          <div className="relative grid grid-cols-2 gap-y-10 gap-x-8 md:grid-cols-[1.2fr_1fr_1.2fr_1fr_0.8fr]">
            {/* Services */}
            <div className="md:col-span-1">
              <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/30">Services</h3>
              {serviceLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Company */}
            <div className="md:col-span-1">
              <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/30">Company</h3>
              {companyLinks.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Contact */}
            <div className="md:col-span-1">
              <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/30">Contact</h3>
              <p className="py-1.5 text-[0.85rem] text-black/50">
                Talk to us or ask us anything.
              </p>
              <a href="mailto:info@boldcrest.com" className={linkClass}>
                &#8250; info@boldcrest.com
              </a>
              <Link href="/contact" className={linkClass}>
                &#8250; Contact Us
              </Link>
            </div>

            {/* Social */}
            <div className="md:col-span-1">
              <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/30">Social</h3>
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  &#8250; {link.label}
                </a>
              ))}
            </div>

            {/* Legal */}
            <div className="md:col-span-1">
              <h3 className="mb-5 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/30">Legal</h3>
              <Link href="#" className={linkClass}>
                Privacy Policy
              </Link>
              <Link href="#" className={linkClass}>
                Terms of Service
              </Link>
            </div>

            {/* Back to top button — absolute top-right */}
            <button
              onClick={scrollToTop}
              className="absolute right-0 top-0 h-[46px] w-[46px] transition-opacity duration-300 hover:opacity-70"
              aria-label="Back to top"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/go-up.svg" alt="" width={46} height={46} />
            </button>
          </div>
        </div>

        {/* Bottom section — motto + copyright */}
        <div className="border-t border-black/10 px-[var(--gutter)]">
          <div className="flex items-end justify-between py-10 md:py-14">
            {/* Motto SVG — left aligned */}
            <div className="w-[clamp(200px,35vw,400px)]">
              <svg viewBox="0 0 493.02 210.71" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-full">
                <g>
                  <path fill="#a3a3a3" d="M0,28.56C0,13.03,13.03,0,28.32,0c7.64,0,14.72,3.22,19.87,8.45l-4.26,4.34c-4.02-4.26-9.57-7-15.61-7-11.91,0-21.96,10.46-21.96,22.77s10.06,22.85,21.96,22.85c6.03,0,11.59-2.74,15.61-7l4.26,4.34c-5.15,5.15-12.23,8.45-19.87,8.45C13.03,57.2,0,44.09,0,28.56Z"/>
                  <path fill="#a3a3a3" d="M92.44,50.28v5.95h-36.45V.97h6.28v49.32h30.17Z"/>
                  <path fill="#a3a3a3" d="M101.53.97h6.28v55.27h-6.28V.97Z"/>
                  <path fill="#a3a3a3" d="M121.73.97h6.28l20.52,38.54L169.03.97h6.28v55.27h-6.28V14.48l-20.52,38.54-20.52-38.54v41.76h-6.28V.97Z"/>
                  <path fill="#a3a3a3" d="M190.43.97h25.34c8.93,0,15.21,5.71,15.21,13.76,0,5.87-2.9,9.25-7.88,12.15,6.36,3.22,10.06,8.21,10.06,14.24,0,8.85-6.84,15.13-16.41,15.13h-26.31V.97ZM214.17,24.38c6.11,0,10.46-3.7,10.46-8.85s-4.34-8.85-10.46-8.85h-17.46v17.7h17.46ZM215.13,50.53c6.84,0,11.67-4.26,11.67-10.22s-4.83-10.22-11.67-10.22h-18.42v20.44h18.42Z"/>
                  <path fill="#a3a3a3" d="M244.1.97h6.28v55.27h-6.28V.97Z"/>
                  <path fill="#a3a3a3" d="M264.29.97h6.28l34.27,44.97V.97h6.28v55.27h-6.28l-34.27-44.97v44.97h-6.28V.97Z"/>
                  <path fill="#a3a3a3" d="M350.54,27.11h22.12v21.64c-5.15,5.15-13.84,8.45-21.48,8.45-15.29,0-28.32-13.11-28.32-28.64S335.89,0,351.18,0c7.64,0,16.33,3.22,21.48,8.45l-4.26,4.34c-4.02-4.26-11.18-7-17.22-7-11.91,0-21.96,10.46-21.96,22.77s10.06,22.85,21.96,22.85c5.15,0,11.1-2.01,15.21-5.15v-13.19h-15.85v-5.95Z"/>
                </g>
                <g>
                  <path fill="#a3a3a3" d="M0,77.27h11.83l17.14,31.22,17.06-31.22h11.91v55.27h-11.91v-34.43l-17.06,31.22-17.14-31.22v34.43H0v-55.27Z"/>
                  <path fill="#a3a3a3" d="M67.1,104.86c0-15.53,13.52-28.56,29.37-28.56s29.37,13.03,29.37,28.56-13.36,28.64-29.37,28.64-29.37-13.11-29.37-28.64ZM113.68,104.86c0-9.57-7.88-17.78-17.22-17.78s-17.14,8.21-17.14,17.78,7.88,17.86,17.14,17.86,17.22-8.21,17.22-17.86Z"/>
                  <path fill="#a3a3a3" d="M134.52,108.65v-31.38h11.83v30.89c0,8.53,5.47,14.56,13.19,14.56s13.11-6.03,13.11-14.56v-30.89h11.91v31.38c0,14.56-10.38,24.86-25.02,24.86s-25.02-10.3-25.02-24.86Z"/>
                  <path fill="#a3a3a3" d="M195.83,77.27h11.83l26.63,35.72v-35.72h11.91v55.27h-11.91l-26.63-35.72v35.72h-11.83v-55.27Z"/>
                  <path fill="#a3a3a3" d="M271.94,87.97h-17.22v-10.7h46.34v10.7h-17.22v44.57h-11.91v-44.57Z"/>
                  <path fill="#a3a3a3" d="M341.85,123.85h-24.62l-3.54,8.69h-13.27l22.53-55.27h13.27l22.53,55.27h-13.36l-3.54-8.69ZM337.75,113.8l-8.21-20.19-8.21,20.19h16.41Z"/>
                  <path fill="#a3a3a3" d="M365.43,77.27h11.91v55.27h-11.91v-55.27Z"/>
                  <path fill="#a3a3a3" d="M388.84,77.27h11.83l26.63,35.72v-35.72h11.91v55.27h-11.91l-26.63-35.72v35.72h-11.83v-55.27Z"/>
                  <path fill="#a3a3a3" d="M447,124.33l6.84-8.13c5.23,4.51,11.18,7.24,18.18,7.24,5.95,0,9.01-2.74,9.01-6.19,0-3.94-3.22-5.15-11.67-7.08-11.67-2.65-19.95-5.95-19.95-16.65s8.37-17.22,20.44-17.22c9.01,0,16.01,2.82,21.64,7.64l-6.2,8.53c-4.91-3.94-10.46-6.11-15.77-6.11s-8.13,2.65-8.13,5.95c0,4.02,3.3,5.31,11.83,7.24,11.91,2.65,19.79,6.2,19.79,16.41s-7.96,17.54-21.48,17.54c-9.57,0-18.1-3.22-24.54-9.17Z"/>
                </g>
                <g>
                  <path fill="#a3a3a3" d="M16.59,167.72H0v-14.14h49.04v14.14h-16.59v42.01h-15.86v-42.01Z"/>
                  <path fill="#a3a3a3" d="M51.33,181.62c0-15.77,13.98-29.01,30.57-29.01s30.57,13.24,30.57,29.01-13.98,29.1-30.57,29.1-30.57-13.32-30.57-29.1ZM96.11,181.62c0-7.93-6.54-14.63-14.22-14.63s-14.22,6.7-14.22,14.63,6.54,14.71,14.22,14.71,14.22-6.7,14.22-14.71Z"/>
                  <path fill="#a3a3a3" d="M145.81,176.88h26.32v23.86c-5.8,6.29-14.38,9.97-23.21,9.97-16.84,0-30.98-13.32-30.98-29.1s14.14-29.01,30.98-29.01c8.83,0,17.41,3.68,23.21,9.89l-11.69,10.22c-2.78-3.6-7.03-5.72-11.52-5.72-7.93,0-14.63,6.7-14.63,14.63s6.7,14.71,14.63,14.71c2.78,0,5.48-.82,7.85-2.29v-5.48h-10.95v-11.69Z"/>
                  <path fill="#a3a3a3" d="M196.48,167.72v6.29h26.73v14.14h-26.73v7.44h29.34v14.14h-45.2v-56.15h45.2v14.14h-29.34Z"/>
                  <path fill="#a3a3a3" d="M247.4,167.72h-16.59v-14.14h49.04v14.14h-16.59v42.01h-15.86v-42.01Z"/>
                  <path fill="#a3a3a3" d="M338.77,153.58v56.15h-15.86v-21.58h-20.51v21.58h-15.86v-56.15h15.86v20.43h20.51v-20.43h15.86Z"/>
                  <path fill="#a3a3a3" d="M364.44,167.72v6.29h26.73v14.14h-26.73v7.44h29.34v14.14h-45.2v-56.15h45.2v14.14h-29.34Z"/>
                  <path fill="#a3a3a3" d="M434.4,209.73l-11.85-16.92h-4.9v16.92h-15.86v-56.15h26.89c12.59,0,21.49,8.09,21.49,19.62,0,8.01-4.25,14.3-11.12,17.49l13.4,19.04h-18.06ZM417.64,178.43h9.73c3.76,0,6.46-2.21,6.46-5.23s-2.7-5.23-6.46-5.23h-9.73v10.46Z"/>
                </g>
                <circle fill="#a3a3a3" cx="466.05" cy="198.34" r="12.37"/>
              </svg>
            </div>

            {/* Copyright — bottom right */}
            <span className="text-[0.75rem] text-black/40">
              &copy; {new Date().getFullYear()} BoldCrest. All rights reserved.
            </span>
          </div>
        </div>
    </footer>
  )
}
