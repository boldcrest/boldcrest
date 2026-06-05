import type { Metadata } from 'next'
import MagneticBase from '@/components/MagneticButton'

export const metadata: Metadata = {
  title: 'Button Preview',
  robots: { index: false, follow: false },
}

/**
 * Simple preview of the new hover-stroke behaviour:
 *  - the trailing outlines match the button (black button → black lines,
 *    white button → white lines)
 *  - three lines stepping DOWN in opacity from inner (75%) to outer (25%)
 * Hover each button to see the trailing strokes.
 */
export default function ButtonPreviewPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      {/* Black button on a light surface → black lines */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-6 bg-[#ededed] md:min-h-screen">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-black/40">
          Black button — black lines
        </p>
        <MagneticBase
          href="#"
          lineColor="#000000"
          className="rounded-[var(--radius-pill)] bg-black px-9 py-[1.1rem] text-[0.8rem] font-semibold uppercase tracking-[0.14em]"
        >
          {/* color on the span, not the link: globals' unlayered `a {color:inherit}`
              would otherwise override a text-* utility on the <a> */}
          <span className="relative z-10 text-white">Hover Me</span>
        </MagneticBase>
      </section>

      {/* White button on a dark surface → white lines */}
      <section className="flex min-h-[50vh] flex-col items-center justify-center gap-6 bg-[#0a0a0a] md:min-h-screen">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-white/40">
          White button — white lines
        </p>
        <MagneticBase
          href="#"
          lineColor="#ffffff"
          className="rounded-[var(--radius-pill)] bg-white px-9 py-[1.1rem] text-[0.8rem] font-semibold uppercase tracking-[0.14em]"
        >
          <span className="relative z-10 text-black">Hover Me</span>
        </MagneticBase>
      </section>
    </main>
  )
}
