import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coming Soon',
  robots: { index: false, follow: false },
}

/**
 * Temporary holding page shown on the live domain (www.boldcrest.com) while the
 * site is still being finished. The proxy (src/proxy.ts) rewrites the canonical
 * host here; the boldcrest-puce.vercel.app URL is unaffected so work continues
 * on the full site. Rendered as a fixed full-screen layer so it sits over the
 * shared Header/Footer without touching the root layout.
 */
export default function ComingSoonPage() {
  return (
    <main className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#0a0a0a] px-6">
      <h1
        style={{ fontFamily: 'var(--font-metropolis), sans-serif' }}
        className="select-none text-center font-black uppercase leading-none tracking-[0.04em] text-white text-[clamp(2.75rem,11vw,8rem)]"
      >
        Coming Soon
      </h1>
    </main>
  )
}
