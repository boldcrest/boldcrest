import type { Metadata } from 'next'

/* /start just opens the Start-a-Project panel over the home page (see
   page.tsx) — it isn't real content, so it shouldn't appear in search
   results. robots.ts no longer disallows this path so Google can actually
   crawl it and see this noindex tag, rather than indexing a bare URL it
   was blocked from checking. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function StartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
