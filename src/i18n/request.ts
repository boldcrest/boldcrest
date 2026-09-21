import { getRequestConfig } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { routing } from './routing'

type Messages = Record<string, Record<string, string>>

/**
 * Deep-merge a locale catalogue over English, NAMESPACE BY NAMESPACE.
 *
 * A shallow `{ ...en, ...locale }` looks right but silently drops keys: the
 * locale's `Language` object REPLACES English's, so any key that locale has not
 * translated yet (e.g. the language self-names, which stay English on purpose)
 * disappears and `t('…')` throws at render time. Merging per namespace is what
 * actually delivers the per-key fallback described below.
 */
function mergeOverEnglish(en: Messages, locale: Messages): Messages {
  const out: Messages = { ...en }
  for (const [namespace, keys] of Object.entries(locale)) {
    out[namespace] = { ...(en[namespace] ?? {}), ...keys }
  }
  return out
}

/**
 * Messages are merged over English, so any key not yet translated falls back to
 * the English string instead of rendering a raw key or an empty node.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const en = (await import('../../messages/en.json')).default as Messages
  const messages =
    locale === 'en'
      ? en
      : mergeOverEnglish(
          en,
          (await import(`../../messages/${locale}.json`)).default as Messages,
        )

  return { locale, messages }
})
