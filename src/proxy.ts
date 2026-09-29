import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

/**
 * Vanity subdomains that EMBED a ClickUp form inside the BoldCrest site.
 *
 * Each host points at this Vercel project; instead of redirecting to the bare
 * ClickUp page we REWRITE (URL stays on the subdomain) to an on-site route that
 * renders the form in an iframe with the site header/footer. These are
 * single-purpose hosts, so EVERY request on them is rewritten to the form.
 *
 * Form URLs live with the page: careers in `app/careers`, the rest in
 * `app/forms/forms.config.ts` (served at /forms/<slug>).
 */
const SUBDOMAIN_EMBEDS: Record<string, string> = {
  'careers.boldcrest.com': '/careers',
  'branding.boldcrest.com': '/forms/branding',
  'timeoff.boldcrest.com': '/forms/timeoff',
  'employee.boldcrest.com': '/forms/employee',
  'client.boldcrest.com': '/forms/client',
}

/**
 * Vanity subdomains that 307-redirect to an EXTERNAL destination (Synology).
 *
 * 307 (temporary) is used on purpose so the targets can change later without
 * browsers caching the old destination. Switch to 308 if a target is permanent.
 */
const SUBDOMAIN_REDIRECTS: Record<string, string> = {
  'drive.boldcrest.com': 'https://boldarchive.cz1.quickconnect.to/?launchApp=SYNO.SDS.Drive.Application',
  'archive.boldcrest.com': 'http://quickconnect.to/BoldArchive',
}

/**
 * Vanity subdomains that 308-redirect to a FIXED path on the canonical host —
 * NOT a rewrite (unlike SUBDOMAIN_EMBEDS above): the target page assumes it's
 * on the canonical host. /start in particular is a client-side shim that
 * opens the global chat panel then does `router.replace('/')` — under a
 * rewrite that same-host replace would hit this exact rule again and loop.
 * A redirect lands the visitor on www.boldcrest.com first, where that replace
 * (and every other relative link on the site) behaves normally.
 */
const SUBDOMAIN_TO_CANONICAL_PATH: Record<string, string> = {
  'start.boldcrest.com': '/start',
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

/** Canonical hosts for the live site (used to scope the /careers redirect). */
const CANONICAL_HOSTS = new Set(['boldcrest.com', 'www.boldcrest.com'])

export function proxy(req: NextRequest) {
  const host = (req.headers.get('host') ?? '').toLowerCase().split(':')[0]

  const embedPath = SUBDOMAIN_EMBEDS[host]
  if (embedPath) {
    const url = req.nextUrl.clone()
    // Prefixed with the default locale: this rewrite returns immediately and
    // never reaches the i18n middleware below, and every route now lives under
    // the [locale] segment — an unprefixed pathname would 404.
    url.pathname = `/${routing.defaultLocale}${embedPath}`
    return NextResponse.rewrite(url)
  }

  const destination = SUBDOMAIN_REDIRECTS[host]
  if (destination) {
    return NextResponse.redirect(destination, 307)
  }

  const canonicalPath = SUBDOMAIN_TO_CANONICAL_PATH[host]
  if (canonicalPath) {
    return NextResponse.redirect(`${CANONICAL_SITE}${canonicalPath}`, 308)
  }

  if (DOMAIN_REDIRECTS.has(host)) {
    return NextResponse.redirect(CANONICAL_SITE, 308)
  }

  // Any other boldcrest.com subdomain isn't a real destination — DNS is
  // wildcarded (*.boldcrest.com → Vercel) so typos and retired subdomains
  // would otherwise silently serve the homepage (Next's routing is
  // host-agnostic; only the rules above make a host special). REDIRECT
  // (not rewrite) to the canonical host, same path: a rewrite would render
  // the site under the wrong host, and every nav link on the page is
  // relative, so visitors get stuck bouncing around the bad host forever
  // with no way back to the real site. A path that's genuinely invalid
  // still 404s normally — just on www.boldcrest.com, where the nav actually
  // works.
  if (host.endsWith('.boldcrest.com') && !CANONICAL_HOSTS.has(host)) {
    const dest = new URL(req.nextUrl.pathname + req.nextUrl.search, CANONICAL_SITE)
    return NextResponse.redirect(dest, 308)
  }

  // The public boldcrest.com/careers URL is retired — careers now lives at
  // careers.boldcrest.com. 308-redirect the old path there so existing links,
  // bookmarks and search results still land on the form. NOTE: this is gated to
  // the CANONICAL hosts only; careers.boldcrest.com is handled by the rewrite
  // above (it's not a canonical host), so it never reaches this rule — no loop.
  if (CANONICAL_HOSTS.has(host) && req.nextUrl.pathname === '/careers') {
    return NextResponse.redirect('https://careers.boldcrest.com', 308)
  }

  // Everything that reaches here is a real page on the canonical host, so hand
  // it to the i18n middleware LAST — after the host-based rules above have had
  // their say. ALL app routes now live under [locale] (including /studio and
  // the embed targets), so nothing is excluded; with localePrefix 'as-needed'
  // the public URLs are unchanged.
  return intlMiddleware(req)
}

export const config = {
  // Run on page requests but skip Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|txt|xml|webmanifest|woff2?|ttf|otf)$).*)',
  ],
}
