import { defineRouting } from 'next-intl/routing'

/**
 * Locales. `sq` is Albanian's real ISO code — the UI shows it as "AL" because
 * that is what local visitors read, but the URL, <html lang> and hreflang must
 * all use `sq` for search engines and screen readers.
 */
// Albanian is switched OFF for now (2026-09-25, Aldo's call): its strings
// (messages/sq.json, the Sanity i18n.sq fields) stay in place; it is only
// absent from the routes, the switcher and the sitemap, and /sq/* 308s to
// the English page (see proxy.ts). To bring it back: add 'sq' here and in
// LanguageButton's LOCALES, and drop the redirect.
export const LOCALES = ['en', 'it', 'fr'] as const
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
