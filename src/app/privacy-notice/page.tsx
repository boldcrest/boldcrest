import type { Metadata } from 'next'
import Link from 'next/link'
import LegalLayout from '@/components/legal/LegalLayout'

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description:
    'How BoldCrest SH.P.K. collects, uses, stores, shares, and protects personal information, in line with GDPR, UK GDPR, and Albanian data protection law.',
  alternates: { canonical: '/privacy-notice' },
  openGraph: {
    title: 'Privacy Notice — BoldCrest',
    description:
      'How BoldCrest collects, uses, and protects personal information.',
    url: '/privacy-notice',
  },
}

export default function PrivacyNoticePage() {
  return (
    <LegalLayout label="Legal" title="Privacy Notice" effectiveDate="June 10, 2026">
      <h2>Introduction</h2>
      <p>At BoldCrest, privacy is part of good design.</p>
      <p>
        This Privacy Notice explains how BoldCrest SH.P.K. (&ldquo;BoldCrest&rdquo;,
        &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) collects, uses,
        stores, shares, and protects personal information when you visit our
        website, contact us, request our services, apply for a position, subscribe
        to our communications, or otherwise interact with us.
      </p>
      <p>
        We are committed to processing personal information fairly, transparently,
        and securely in accordance with applicable data protection laws, including
        the General Data Protection Regulation (EU) 2016/679 (&ldquo;GDPR&rdquo;),
        the UK GDPR, Albanian Law No. 124/2024 &ldquo;On Personal Data
        Protection&rdquo;, and other applicable privacy laws.
      </p>

      <h2>Data Controller</h2>
      <address>
        BoldCrest SH.P.K.
        <br />
        NUIS: M41714029L
        <br />
        Rr. Prokop Mima, Olympic Residence, H.1, Kati 10, Ap.37
        <br />
        1019 Tirana, Albania
      </address>
      <p>
        Email:{' '}
        <a href="mailto:info@boldcrest.com">info@boldcrest.com</a>
      </p>

      <h2>Information We Collect</h2>
      <h3>Information You Provide Directly</h3>
      <p>We may collect information that you voluntarily provide, including:</p>
      <ul>
        <li>Name</li>
        <li>Company name</li>
        <li>Email address</li>
        <li>Telephone number</li>
        <li>Job title</li>
        <li>Project details and requirements</li>
        <li>Budget information</li>
        <li>Portfolio submissions</li>
        <li>CVs and employment applications</li>
        <li>Communications and correspondence</li>
        <li>
          Any information included in forms, messages, attachments, or uploaded
          documents
        </li>
      </ul>

      <h3>Information Collected Automatically</h3>
      <p>
        When you use our website, we may automatically collect certain
        information, including:
      </p>
      <ul>
        <li>IP address</li>
        <li>Browser type and version</li>
        <li>Device information</li>
        <li>Operating system</li>
        <li>Language preferences</li>
        <li>Referring URLs</li>
        <li>Pages viewed</li>
        <li>Date and time of visits</li>
        <li>Website usage and interaction data</li>
        <li>Cookie identifiers and similar technologies</li>
      </ul>

      <h3>Information From Third Parties</h3>
      <p>We may receive information from:</p>
      <ul>
        <li>Marketing and advertising platforms</li>
        <li>Analytics providers</li>
        <li>Social media platforms</li>
        <li>Recruitment platforms</li>
        <li>Referral partners</li>
        <li>Publicly available sources</li>
      </ul>

      <h2>How We Use Personal Information</h2>
      <p>We use personal information to:</p>
      <ul>
        <li>Respond to enquiries and requests</li>
        <li>Prepare proposals, quotations, and project scopes</li>
        <li>
          Deliver creative, branding, design, development, marketing, and
          consulting services
        </li>
        <li>Manage client relationships</li>
        <li>Process transactions and invoices</li>
        <li>Recruit and evaluate candidates</li>
        <li>Improve our website, services, and user experience</li>
        <li>Monitor website performance and security</li>
        <li>Detect, prevent, and investigate fraud or misuse</li>
        <li>Communicate important updates</li>
        <li>Comply with legal and regulatory obligations</li>
        <li>Establish, exercise, or defend legal claims</li>
      </ul>

      <h2>Legal Bases for Processing</h2>
      <p>
        Where GDPR or similar laws apply, we process personal information based on
        one or more of the following legal grounds:
      </p>
      <h3>Contractual Necessity</h3>
      <p>
        Where processing is necessary to perform a contract or take steps before
        entering into a contract.
      </p>
      <h3>Legitimate Interests</h3>
      <p>
        Where processing is necessary for our legitimate business interests,
        including:
      </p>
      <ul>
        <li>Operating and improving our services</li>
        <li>Managing client relationships</li>
        <li>Business development</li>
        <li>Security and fraud prevention</li>
        <li>Internal administration</li>
      </ul>
      <h3>Consent</h3>
      <p>Where required by law, we process information based on your consent.</p>
      <p>You may withdraw consent at any time.</p>
      <h3>Legal Obligations</h3>
      <p>
        Where processing is necessary to comply with applicable legal obligations.
      </p>

      <h2>Recruitment and Careers</h2>
      <p>
        If you apply for a role through our website, careers platform, email, or
        other channels, we may process:
      </p>
      <ul>
        <li>CVs and resumes</li>
        <li>Cover letters</li>
        <li>Portfolios</li>
        <li>Employment history</li>
        <li>Educational background</li>
        <li>Interview notes</li>
        <li>References</li>
        <li>Professional profile information</li>
      </ul>
      <p>We use this information solely for recruitment and hiring purposes.</p>
      <p>
        Unless otherwise required by law or agreed with you, unsuccessful
        applications will be retained only for a reasonable period and then
        securely deleted.
      </p>

      <h2>Cookies and Similar Technologies</h2>
      <p>
        Our website may use cookies, analytics tools, pixels, and similar
        technologies to:
      </p>
      <ul>
        <li>Ensure website functionality</li>
        <li>Improve user experience</li>
        <li>Measure website performance</li>
        <li>Understand visitor behavior</li>
        <li>Support marketing and advertising activities</li>
      </ul>
      <p>
        Additional information is available in our{' '}
        <Link href="/cookie-policy">Cookie Policy</Link>.
      </p>

      <h2>Marketing Communications</h2>
      <p>
        Where permitted by law, we may send information about our services,
        projects, events, insights, or company updates.
      </p>
      <p>
        You may unsubscribe or opt out at any time by following the instructions
        included in the communication or by contacting us.
      </p>

      <h2>Sharing Personal Information</h2>
      <p>We do not sell personal information.</p>
      <p>
        We may share information with trusted third parties where necessary to
        operate our business, including:
      </p>
      <ul>
        <li>Hosting providers</li>
        <li>Cloud infrastructure providers</li>
        <li>Email and communication providers</li>
        <li>Analytics providers</li>
        <li>Customer relationship management systems</li>
        <li>Project management platforms</li>
        <li>Recruitment platforms</li>
        <li>Professional advisers, accountants, auditors, and legal counsel</li>
        <li>Government authorities where required by law</li>
      </ul>
      <p>
        All service providers are expected to maintain appropriate confidentiality
        and security measures.
      </p>

      <h2>International Data Transfers</h2>
      <p>
        Because we work with clients, partners, and service providers
        internationally, personal information may be transferred to and processed
        in countries outside your jurisdiction.
      </p>
      <p>
        Where required by law, we implement appropriate safeguards, including:
      </p>
      <ul>
        <li>Standard Contractual Clauses approved by relevant authorities</li>
        <li>Adequacy decisions</li>
        <li>Contractual and organizational protections</li>
        <li>Other lawful transfer mechanisms</li>
      </ul>

      <h2>Data Security</h2>
      <p>
        We implement reasonable technical, organizational, and administrative
        measures designed to protect personal information against:
      </p>
      <ul>
        <li>Unauthorized access</li>
        <li>Accidental loss</li>
        <li>Misuse</li>
        <li>Disclosure</li>
        <li>Alteration</li>
        <li>Destruction</li>
      </ul>
      <p>
        However, no method of transmission or storage can be guaranteed to be
        completely secure.
      </p>

      <h2>Data Retention</h2>
      <p>We retain personal information only for as long as necessary to:</p>
      <ul>
        <li>Deliver services</li>
        <li>Manage contracts and client relationships</li>
        <li>Fulfill legal, accounting, and regulatory obligations</li>
        <li>Resolve disputes</li>
        <li>Protect our legitimate business interests</li>
      </ul>
      <p>
        Retention periods vary depending on the nature of the information and
        applicable legal requirements.
      </p>

      <h2>Your Rights</h2>
      <p>
        Depending on your location and applicable law, you may have the right to:
      </p>
      <ul>
        <li>Access your personal information</li>
        <li>Correct inaccurate information</li>
        <li>Request deletion of information</li>
        <li>Restrict processing</li>
        <li>Object to processing</li>
        <li>Withdraw consent</li>
        <li>Request portability of your information</li>
        <li>Lodge a complaint with a supervisory authority</li>
      </ul>
      <p>
        To exercise any of these rights, please contact us using the details below.
      </p>

      <h2>Children&apos;s Privacy</h2>
      <p>
        Our website and services are not directed to children under the age
        required by applicable law.
      </p>
      <p>
        We do not knowingly collect personal information from children without
        appropriate authorization.
      </p>

      <h2>Third-Party Websites</h2>
      <p>
        Our website may contain links to third-party websites, platforms, or
        services.
      </p>
      <p>
        We are not responsible for the privacy practices or content of third-party
        websites. We encourage you to review their privacy notices before
        providing personal information.
      </p>

      <h2>Changes to This Privacy Notice</h2>
      <p>
        We may update this Privacy Notice from time to time to reflect legal,
        technical, or business developments.
      </p>
      <p>
        Any updates will be published on this page with a revised effective date.
      </p>

      <h2>Contact Us</h2>
      <p>
        If you have questions, requests, or concerns regarding this Privacy Notice
        or our handling of personal information, please contact:
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
      <p>
        We will make reasonable efforts to respond to privacy-related requests in
        accordance with applicable law.
      </p>
    </LegalLayout>
  )
}
