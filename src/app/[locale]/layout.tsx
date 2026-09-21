import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import '../globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import LenisProvider from '@/components/LenisProvider'
import ImageGuard from '@/components/ImageGuard'
import PageTransitionProvider from '@/components/PageTransition'
import StartProjectProvider from '@/components/start-project/StartProjectProvider'
import CookieBanner from '@/components/CookieBanner'
import SiteAnalytics from '@/components/SiteAnalytics'
import { SanityLive } from '@/sanity/lib/live'
import { notFound } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import { hasLocale } from 'next-intl'
import { setRequestLocale } from 'next-intl/server'
import { routing } from '@/i18n/routing'

const metropolis = localFont({
  src: [
    { path: '../../fonts/Metropolis-Light.otf', weight: '300', style: 'normal' },
    { path: '../../fonts/Metropolis-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../fonts/Metropolis-RegularItalic.otf', weight: '400', style: 'italic' },
    { path: '../../fonts/Metropolis-Medium.otf', weight: '500', style: 'normal' },
    { path: '../../fonts/Metropolis-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../../fonts/Metropolis-Bold.otf', weight: '700', style: 'normal' },
    { path: '../../fonts/Metropolis-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: '../../fonts/Metropolis-Black.otf', weight: '900', style: 'normal' },
  ],
  variable: '--font-metropolis',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boldcrest.com'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'BoldCrest',
    template: '%s — BoldCrest',
  },
  description:
    'We build identities and shape perceptions. Go bold or go unseen.',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'BoldCrest',
    title: 'BoldCrest',
    description:
      'We build identities and shape perceptions. Go bold or go unseen.',
    url: siteUrl,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'BoldCrest',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BoldCrest',
    description:
      'We build identities and shape perceptions. Go bold or go unseen.',
    images: ['/og-image.png'],
  },
  // Tab icon — a black CIRCLE + white crest on EVERY tab (icon.svg vector +
  // matching black-circle favicon.ico 16/32/48, both transparent outside the
  // disc). Chrome/Firefox/Edge and inactive Safari tabs render it as a clean
  // disc — the transparent corners show the tab's own colour, no white.
  // Known, accepted trade-off: Safari's *active* tab has a lighter background,
  // so on that one focused tab the circle's corners show as faint grey. There's
  // no way to avoid this for a dark disc (a light tile like wolffolins.com's
  // yellow hides it, but that fights the brand); the round look is worth it.
  // apple-touch (iPhone Safari favourites + iOS home screen) stays the rounded
  // square on purpose — that one is intentional and left as-is.
  // ?v busts Safari's sticky favicon cache — bump it whenever the bytes change.
  icons: {
    icon: [
      { url: '/favicon.ico?v=9', sizes: '16x16 32x32 48x48' },
      { url: '/icon.svg?v=9', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico?v=9',
    apple: [{ url: '/apple-touch-icon.png?v=9', sizes: '180x180', type: 'image/png' }],
    other: [{ rel: 'mask-icon', url: '/safari-pinned-tab.svg?v=3', color: '#0a0a0a' }],
  },
  manifest: '/site.webmanifest',
  other: {
    'msapplication-config': '/browserconfig.xml',
    'msapplication-TileColor': '#0a0a0a',
  },
  applicationName: 'BoldCrest',
  authors: [{ name: 'BoldCrest', url: siteUrl }],
  creator: 'BoldCrest',
  publisher: 'BoldCrest',
  category: 'Creative Agency',
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

/**
 * THE root layout. It lives inside [locale] on purpose: <html lang> and
 * NextIntlClientProvider both need the active locale, and anywhere ABOVE this
 * segment `setRequestLocale` has not run yet — which silently drops every route
 * in the app to dynamic rendering (measured: 237 prerendered routes -> 3).
 * Everything, including /studio and the embed routes, therefore sits under
 * [locale]; with localePrefix 'as-needed' their public URLs are unchanged.
 */
export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  return (
    <html lang={locale}>
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
              // Square brand mark (white shield on solid black) — the image
              // Google uses for the Knowledge Graph entity logo shown in the
              // knowledge panel and address-bar autocomplete. Must be square
              // with a solid background. Dedicated 1000×1000 PNG (larger and
              // higher-quality than the 512 icon Google previously had).
              logo: 'https://www.boldcrest.com/logo-1000.png',
              image: 'https://www.boldcrest.com/logo-1000.png',
              email: 'info@boldcrest.com',
              description: 'Creative agency offering brand development, photography, video, animation, and communication. 300+ projects, 30+ brands, 7+ years.',
              foundingDate: '2019',
              founder: [
                { '@type': 'Person', name: 'Xhulio Joka' },
                { '@type': 'Person', name: 'Aldo Hako' },
              ],
              // Full street address — kept identical to the primary Google Business
              // Profile listing so Google resolves them to one entity (NAP match).
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Olympic Residence, 37/1, Rruga Prokop Mima',
                addressLocality: 'Tirana',
                postalCode: '1019',
                addressCountry: 'AL',
              },
              sameAs: ['https://www.instagram.com/boldcrest/', 'https://www.behance.net/boldcrest', 'https://www.linkedin.com/company/boldcrest/', 'https://www.facebook.com/boldcrest', 'https://vimeo.com/boldcrest'],
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              '@id': 'https://www.boldcrest.com/#website',
              name: 'BoldCrest',
              url: 'https://www.boldcrest.com',
              publisher: { '@id': 'https://www.boldcrest.com/#organization' },
              inLanguage: 'en',
            }),
          }}
        />
      </head>
      <body className={metropolis.variable}>
        {/* Provider sits at the ROOT, not inside [locale], because Header and
            Footer render here and are shared with the non-localized routes. */}
        <NextIntlClientProvider>
          <ImageGuard />
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
          <CookieBanner />
          <SanityLive />
          <SiteAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
