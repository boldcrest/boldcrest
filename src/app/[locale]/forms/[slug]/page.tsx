import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EMBEDDED_FORMS } from '../forms.config'

// Fixed header height the form should clear (matches /careers)
const HEADER_OFFSET = '80px'

export function generateStaticParams() {
  return Object.keys(EMBEDDED_FORMS).map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const form = EMBEDDED_FORMS[slug]
  if (!form) return {}
  return {
    title: form.title,
    description: form.description,
    // Internal intake/utility forms — keep them out of search results.
    robots: { index: false, follow: false },
  }
}

export default async function FormPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const form = EMBEDDED_FORMS[slug]
  if (!form) notFound()

  return (
    <main className="relative w-full bg-[#0a0a0a]" style={{ paddingTop: HEADER_OFFSET }}>
      {/*
        The form fills the viewport below the header and scrolls INTERNALLY.
        We intentionally do NOT use ClickUp's dynamic-height resizer: it
        under-measures these long, multi-section forms and lets the footer flow
        up over the lower half. A fixed-height frame keeps the footer cleanly
        below a full-screen form. (Same approach as /careers.)
      */}
      <iframe
        src={form.url}
        title={`BoldCrest — ${form.title}`}
        className="block w-full"
        style={{
          width: '100%',
          height: `calc(100dvh - ${HEADER_OFFSET})`,
          border: 'none',
          background: 'transparent',
        }}
      />
    </main>
  )
}
