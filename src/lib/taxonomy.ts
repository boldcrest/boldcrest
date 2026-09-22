import { useMessages } from 'next-intl'

/**
 * Project `services` and `industry` values are stored in Sanity in English and
 * are the keys the /work filters match on, so they cannot be translated in
 * place. This maps a stored value to its display label for the active locale
 * and falls back to the raw value, so a new taxonomy entry still renders
 * (in English) instead of throwing the way `t()` would on a missing key.
 */
export function taxonomyKey(value: string): string {
  const parts = value
    .replace(/&/g, ' ')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
  if (parts.length === 0) return value
  return parts
    .map((p, i) => (i === 0 ? p.toLowerCase() : p[0].toUpperCase() + p.slice(1).toLowerCase()))
    .join('')
}

type Labels = Record<string, string>

export function labelFor(labels: Labels, value?: string | null): string {
  if (!value) return ''
  return labels[taxonomyKey(value)] ?? value
}

/** Client components: returns a `(value) => label` function. */
export function useTaxonomyLabel() {
  const messages = useMessages() as unknown as Record<string, Labels>
  const labels = messages.Taxonomy ?? {}
  return (value?: string | null) => labelFor(labels, value)
}

/**
 * Narrow surfaces (the phone-width project card) want a shorter label. Falls
 * back to the full label, then to the raw value.
 */
export function shortLabelFor(labels: Labels, value?: string | null): string {
  if (!value) return ''
  const key = taxonomyKey(value)
  return labels[`${key}Short`] ?? labels[key] ?? value
}

/** Client components: returns a `(value) => short label` function. */
export function useTaxonomyShortLabel() {
  const messages = useMessages() as unknown as Record<string, Labels>
  const labels = messages.Taxonomy ?? {}
  return (value?: string | null) => shortLabelFor(labels, value)
}
