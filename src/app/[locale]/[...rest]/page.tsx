import { notFound } from 'next/navigation'

/**
 * Catch-all that restores the BRANDED 404.
 *
 * `[locale]` is the only root segment and this app has no root layout on
 * purpose (`[locale]/layout.tsx` IS the root layout — putting the provider
 * above it kills static rendering on every route). So an unmatched path
 * matched no route at all, fell through to a root not-found that does not
 * exist, and Next served its own black-and-white 404 on every locale,
 * English included.
 *
 * Matching the path here and calling notFound() keeps the request inside the
 * locale segment, so `[locale]/not-found.tsx` renders with the header, footer
 * and the right language.
 */
export default function CatchAllNotFound() {
  notFound()
}
