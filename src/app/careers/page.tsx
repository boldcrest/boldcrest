import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers',
  description:
    'Join the BoldCrest team. Tell us about yourself and apply. It goes straight to our team.',
  openGraph: {
    title: 'Careers — BoldCrest',
    description:
      'Join the BoldCrest team. Tell us about yourself and apply. It goes straight to our team.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

// ClickUp careers form (connected to BoldCrest's hiring pipeline)
const CAREERS_FORM_URL =
  'https://forms.clickup.com/765766/f/qbu6-78675/YYNYNPGM162O3GYR61'

// Fixed header height the form should clear
const HEADER_OFFSET = '80px'

export default function CareersPage() {
  return (
    <main className="relative w-full bg-[#0a0a0a]" style={{ paddingTop: HEADER_OFFSET }}>
      {/*
        The form fills the viewport below the header and scrolls INTERNALLY.
        We intentionally do NOT use ClickUp's dynamic-height resizer: it
        under-measures this long, multi-section form and lets the footer flow
        up over the lower half. A fixed-height frame keeps the footer cleanly
        below a full-screen form.
      */}
      <iframe
        src={CAREERS_FORM_URL}
        title="BoldCrest Careers Application"
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
