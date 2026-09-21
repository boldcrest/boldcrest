import { getTranslations, setRequestLocale } from 'next-intl/server'
import type { Metadata } from 'next'
import { routing } from '@/i18n/routing'
import { sanityFetch } from '@/sanity/lib/live'
import { siteSettingsQuery } from '@/sanity/lib/queries'
import ContactPageClient from './ContactPageClient'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Seo' })
  const tn = await getTranslations({ locale, namespace: 'Nav' })
  const prefix = locale === routing.defaultLocale ? '' : `/${locale}`

  return {
    title: tn('contact'),
    alternates: { canonical: `${prefix}/contact` },
    description: t('contactDescription'),
    openGraph: {
      title: t('contactTitle'),
      description: t('contactDescription'),
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
  }
}

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  // Required for static rendering per locale — without it every
  // page under [locale] falls back to dynamic rendering.
  const { locale } = await params
  setRequestLocale(locale)

  const { data: settings } = await sanityFetch({ query: siteSettingsQuery })

  return (
    <ContactPageClient
      contactEmail={settings?.contactEmail}
      socialLinks={settings?.socialLinks}
    />
  )
}
