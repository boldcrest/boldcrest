'use client'

import { useEffect } from 'react'
import { CTAButton } from '@/components/MagneticButton'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main className="relative">
      <section className="flex flex-col px-[var(--gutter)] pt-[120px] pb-10 landscape-short:pt-[5.5rem] md:pb-12">
        <div className="w-full">
          <p className="mb-4 text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-text-tertiary">
            Error
          </p>

          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <h1 className="font-display text-[clamp(2.5rem,6.5vw,6rem)] font-bold leading-[1.05] tracking-[-0.02em] text-white landscape-short:text-[2.4rem]">
              500
              <br />
              Something broke
              <br />
              on our end<span className="text-accent">.</span>
            </h1>

            <p className="max-w-[440px] text-[0.95rem] leading-[1.7] text-text-secondary md:text-right">
              An unexpected error occurred.
              <br />
              Try again, or head back to the homepage if it keeps happening.
            </p>
          </div>

          <div className="mt-10 h-px w-full bg-border md:mt-12 lg:mt-16" />

          <div className="mt-10 flex flex-wrap items-center gap-4 md:mt-12">
            <CTAButton onClick={reset} label="Try Again" />
            <CTAButton href="/" label="Back to Home" showArrow />
          </div>
        </div>
      </section>
    </main>
  )
}
