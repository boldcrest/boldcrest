import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

/**
 * Messages are merged over English, so any key not yet translated falls back to
 * the English string instead of rendering a raw key or an empty node. That is
 * what makes the site shippable while sq/it are still being written.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const en = (await import('../../messages/en.json')).default
  const messages =
    locale === 'en'
      ? en
      : { ...en, ...(await import(`../../messages/${locale}.json`)).default }

  return { locale, messages }
})
