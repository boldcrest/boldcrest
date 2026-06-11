import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'How BoldCrest SH.P.K. uses cookies and similar technologies on boldcrest.com, including the cookie types we use and how to manage your preferences.',
  alternates: { canonical: '/cookie-policy' },
  openGraph: {
    title: 'Cookie Policy — BoldCrest',
    description:
      'How BoldCrest uses cookies and similar technologies, and how to manage them.',
    url: '/cookie-policy',
  },
}

export default function CookiePolicyPage() {
  return (
    <LegalLayout label="Legal" title="Cookie Policy" effectiveDate="June 10, 2026">
      <h2>Introduction</h2>
      <p>
        This Cookie Policy explains how BoldCrest SH.P.K. (&ldquo;BoldCrest&rdquo;,
        &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) uses cookies and
        similar technologies when you visit boldcrest.com and any related websites,
        services, or digital experiences operated by us.
      </p>
      <p>
        This Policy should be read together with our{' '}
        <Link href="/privacy-notice">Privacy Notice</Link>.
      </p>

      <h2>What Are Cookies?</h2>
      <p>
        Cookies are small text files placed on your device when you visit a
        website. They help websites function properly, improve user experience,
        remember preferences, analyze website performance, and support marketing
        activities.
      </p>
      <p>
        Cookies may be stored for a limited period of time or until manually
        deleted.
      </p>

      <h2>Types of Cookies We Use</h2>
      <h3>Strictly Necessary Cookies</h3>
      <p>
        These cookies are essential for the operation and security of our website
        and cannot be disabled through our cookie preferences system.
      </p>
      <p>They may be used to:</p>
      <ul>
        <li>Maintain website functionality</li>
        <li>Enable navigation</li>
        <li>Protect against fraud and abuse</li>
        <li>Manage security and authentication</li>
        <li>Remember privacy and cookie preferences</li>
      </ul>
      <p>
        Without these cookies, certain parts of the website may not function
        correctly.
      </p>

      <h3>Analytics Cookies</h3>
      <p>
        Analytics cookies help us understand how visitors interact with our
        website.
      </p>
      <p>These cookies may collect information such as:</p>
      <ul>
        <li>Pages visited</li>
        <li>Time spent on pages</li>
        <li>Navigation paths</li>
        <li>Device and browser information</li>
        <li>Referral sources</li>
        <li>Website performance metrics</li>
      </ul>
      <p>
        We use this information to improve our website, services, and user
        experience.
      </p>

      <h3>Functional Cookies</h3>
      <p>
        Functional cookies allow the website to remember choices and preferences,
        such as:
      </p>
      <ul>
        <li>Language settings</li>
        <li>Region preferences</li>
        <li>Form information</li>
        <li>User interface preferences</li>
      </ul>
      <p>These cookies help provide a more personalized experience.</p>

      <h3>Advertising and Marketing Cookies</h3>
      <p>
        Where applicable, we may use marketing technologies to understand the
        effectiveness of our advertising and to deliver more relevant content.
      </p>
      <p>
        These technologies may be provided by advertising and social media
        platforms and may track interactions across websites and devices.
      </p>

      <h2>Third-Party Technologies</h2>
      <p>
        We may use trusted third-party services that place cookies or similar
        technologies on our website, including services related to:
      </p>
      <ul>
        <li>Website analytics</li>
        <li>Hosting and infrastructure</li>
        <li>Advertising and marketing</li>
        <li>Social media integrations</li>
        <li>Performance monitoring</li>
        <li>Embedded content</li>
      </ul>
      <p>
        The specific providers used by BoldCrest may change over time as our
        technology stack evolves.
      </p>

      <h2>Cookie Consent</h2>
      <p>
        Where required by applicable law, we will request your consent before
        placing non-essential cookies on your device.
      </p>
      <p>
        You may withdraw or modify your consent at any time through our cookie
        settings tool, if available, or through your browser settings.
      </p>
      <p>
        Strictly necessary cookies do not require consent because they are
        essential for the operation of the website.
      </p>

      <h2>Managing Cookies</h2>
      <p>Most web browsers allow you to control cookies through their settings.</p>
      <p>You can generally:</p>
      <ul>
        <li>View stored cookies</li>
        <li>Delete cookies</li>
        <li>Block cookies</li>
        <li>Configure cookie preferences</li>
        <li>Receive notifications before cookies are stored</li>
      </ul>
      <p>
        Please note that disabling certain cookies may affect website
        functionality and your browsing experience.
      </p>
      <p>Helpful browser resources may be available from:</p>
      <ul>
        <li>Google Chrome</li>
        <li>Mozilla Firefox</li>
        <li>Safari</li>
        <li>Microsoft Edge</li>
      </ul>
      <p>
        Refer to your browser provider&apos;s documentation for the most current
        instructions.
      </p>

      <h2>Similar Technologies</h2>
      <p>
        In addition to cookies, we may use similar technologies such as:
      </p>
      <ul>
        <li>Pixels</li>
        <li>Tags</li>
        <li>Local storage</li>
        <li>Session storage</li>
        <li>Web beacons</li>
      </ul>
      <p>
        These technologies serve similar purposes, including functionality,
        analytics, security, and marketing.
      </p>

      <h2>International Visitors</h2>
      <p>Our website may be accessed from countries around the world.</p>
      <p>
        Where required by applicable privacy laws, including the GDPR, UK GDPR, and
        Albanian data protection legislation, we will seek consent for
        non-essential cookies before they are used.
      </p>

      <h2>Changes to This Cookie Policy</h2>
      <p>
        We may update this Cookie Policy periodically to reflect changes in law,
        technology, or our business practices.
      </p>
      <p>
        Any updates will be posted on this page with a revised effective date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions regarding our use of cookies or similar technologies,
        please contact:
      </p>
      <address>
        BoldCrest SH.P.K.
        <br />
        Rr. Prokop Mima, Olympic Residence, H.1, Kati 10, Ap.37
        <br />
        1019 Tirana, Albania
      </address>
      <p>
        Email:{' '}
        <a href="mailto:info@boldcrest.com">info@boldcrest.com</a>
      </p>
    </LegalLayout>
  )
}
