import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LenisProvider from '@/components/LenisProvider'
import PageTransitionProvider from '@/components/PageTransition'
import StartProjectProvider from '@/components/start-project/StartProjectProvider'
import { SanityLive } from '@/sanity/lib/live'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const metropolis = localFont({
  src: [
    { path: '../fonts/Metropolis-Light.otf', weight: '300', style: 'normal' },
    { path: '../fonts/Metropolis-Regular.otf', weight: '400', style: 'normal' },
    { path: '../fonts/Metropolis-RegularItalic.otf', weight: '400', style: 'italic' },
    { path: '../fonts/Metropolis-Medium.otf', weight: '500', style: 'normal' },
    { path: '../fonts/Metropolis-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../fonts/Metropolis-Bold.otf', weight: '700', style: 'normal' },
    { path: '../fonts/Metropolis-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../fonts/Metropolis-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-metropolis',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boldcrest.com'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BoldCrest — Creative Agency',
    template: '%s — BoldCrest',
  },
  description:
    'We build identities and shape perceptions. Go bold or go unseen.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BoldCrest',
    title: 'BoldCrest — Creative Agency',
    description:
      'We build identities and shape perceptions. Go bold or go unseen.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BoldCrest — Creative Agency',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BoldCrest — Creative Agency',
    description:
      'We build identities and shape perceptions. Go bold or go unseen.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'LocalBusiness',
              '@id': 'https://www.boldcrest.com/#organization',
              name: 'BoldCrest',
              url: 'https://www.boldcrest.com',
              email: 'info@boldcrest.com',
              description: 'Creative agency offering brand development, photography, video, animation, and communication. 300+ projects, 30+ brands, 7+ years.',
              address: { '@type': 'PostalAddress', addressLocality: 'Tirana', addressCountry: 'AL' },
              sameAs: ['https://www.instagram.com/boldcrest/', 'https://www.linkedin.com/company/boldcrest/', 'https://www.behance.net/boldcrest', 'https://vimeo.com/boldcrest'],
            }),
          }}
        />
      </head>
      <body className={metropolis.variable}>
        <LenisProvider>
          <PageTransitionProvider>
            <StartProjectProvider>
              <div className="relative z-[1] bg-bg">
                <Header />
                {children}
              </div>
              <Footer />
            </StartProjectProvider>
          </PageTransitionProvider>
        </LenisProvider>
        <SanityLive />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
