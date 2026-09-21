import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

/**
 * Locale-aware navigation. `usePathname` here returns the path WITHOUT the
 * locale prefix, which is exactly what the language switcher needs: it can
 * re-render the current path under a different locale and keep the visitor
 * where they are.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
