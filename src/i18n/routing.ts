import { defineRouting } from 'next-intl/routing'

/**
 * Locales. `sq` is Albanian's real ISO code — the UI shows it as "AL" because
 * that is what local visitors read, but the URL, <html lang> and hreflang must
 * all use `sq` for search engines and screen readers.
 */
export const LOCALES = ['en', 'sq', 'it'] as const
export type AppLocale = (typeof LOCALES)[number]

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: 'en',
  // 'as-needed' keeps English unprefixed: boldcrest.com/work stays exactly
  // where it is, so every existing link, ranking, Pinterest pin and Behance
  // link survives. Only sq/it gain a prefix.
  localePrefix: 'as-needed',
  // Don't auto-redirect by Accept-Language: an Albanian visitor who opens a
  // shared boldcrest.com/work link should land on the page they were sent,
  // not be bounced to /sq. The switcher is explicit.
  localeDetection: false,
})
