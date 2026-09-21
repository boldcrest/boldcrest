'use client'

import { Link as IntlLink } from '@/i18n/navigation'

/**
 * Nav link that keeps the visitor's language.
 *
 * On the canonical host `base` is empty and this uses next-intl's Link, which
 * prefixes the active locale — so from /it/work, "Services" goes to
 * /it/services rather than dropping back to English.
 *
 * On a vanity form subdomain `base` is the ABSOLUTE canonical site (see
 * lib/embed.ts: every relative path on those hosts is rewritten straight back
 * to the form). A locale-aware Link can't express that, so it falls back to a
 * plain anchor — those are untranslated embed pages leaving for the main site.
 */
export default function LocaleLink({
  href,
  base,
  children,
  ...rest
}: {
  href: string
  base: string
  children: React.ReactNode
} & Omit<React.ComponentProps<'a'>, 'href'>) {
  if (base) {
    return (
      <a href={`${base}${href}`} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <IntlLink href={href} {...rest}>
      {children}
    </IntlLink>
  )
}
