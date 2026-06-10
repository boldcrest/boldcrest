import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { siteSettingsQuery } from '@/sanity/lib/queries'
import ContactPageClient from './ContactPageClient'

export const metadata: Metadata = {
  title: 'Contact',
  alternates: { canonical: '/contact' },
  description:
    "Let's talk. Get in touch with BoldCrest to start your next project.",
  openGraph: {
    title: 'Contact — BoldCrest',
    description:
      "Let's talk. Get in touch with BoldCrest to start your next project.",
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
}

export default async function ContactPage() {
  const { data: settings } = await sanityFetch({ query: siteSettingsQuery })

  return (
    <ContactPageClient
      contactEmail={settings?.contactEmail}
      socialLinks={settings?.socialLinks}
    />
  )
}
