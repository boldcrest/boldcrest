import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Vanity-subdomain redirects.
 *
 * Each of these subdomains points at this Vercel project (DNS + project domain);
 * when a request comes in we look at the Host header and 307-redirect it to the
 * real destination (ClickUp forms, Synology Drive, etc.). Any host that isn't
 * listed here falls straight through to the normal site.
 *
 * 307 (temporary) is used on purpose so the targets can change later without
 * browsers caching the old destination. Switch to 308 if a target is permanent.
 */
const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  'careers.boldcrest.com': 'https://forms.clickup.com/765766/f/qbu6-78675/YYNYNPGM162O3GYR61',
  'branding.boldcrest.com': 'https://forms.clickup.com/765766/f/qbu6-40361/90O1PL1P7J6U3HO2RS',
  'timeoff.boldcrest.com': 'https://forms.clickup.com/765766/f/qbu6-78355/ZRZLB67MPJBR7YCSBJ',
  'employee.boldcrest.com': 'https://forms.clickup.com/765766/f/qbu6-74875/D08J11PMYODUN5U4AH',
  'client.boldcrest.com': 'https://forms.clickup.com/765766/f/qbu6-72315/V2M4G4AELYAJ143MQT',
  'drive.boldcrest.com': 'https://boldarchive.cz1.quickconnect.to/?launchApp=SYNO.SDS.Drive.Application',
  'archive.boldcrest.com': 'http://quickconnect.to/BoldArchive',
}

/**
 * Alternate brand domains → the canonical site (308 PERMANENT, so search engines
 * consolidate them onto boldcrest.com). Both the apex and the www host of each
 * domain are covered. We send them straight to the canonical www host to avoid a
 * double hop through the apex→www redirect.
 */
const CANONICAL_SITE = 'https://www.boldcrest.com'
const DOMAIN_REDIRECTS = new Set([
  'boldreactor.com',
  'www.boldreactor.com',
  'boldworkshops.com',
  'www.boldworkshops.com',
])

export function proxy(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().split(':')[0]

  const destination = SUBDOMAIN_REDIRECTS[host]
  if (destination) {
    return NextResponse.redirect(destination, 307)
  }

  if (DOMAIN_REDIRECTS.has(host)) {
    return NextResponse.redirect(CANONICAL_SITE, 308)
  }

  return NextResponse.next()
}

export const config = {
  // Run on page requests but skip Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|webmanifest|woff2?|ttf|otf)$).*)',
  ],
}
