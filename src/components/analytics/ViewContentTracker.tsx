'use client'

import { useEffect } from 'react'
import { trackViewContent, newMetaEventId } from '@/lib/analytics'
import { reportViewContent } from './actions'

/* Fires a ViewContent (Meta) / view_item (GA4) once when a portfolio/case-study
   page mounts — the standard "viewed a piece of content" signal. Rendered by the
   server-side ProjectHero; all of it is a no-op until cookies are accepted.

   The Meta half goes out TWICE on purpose — once from the browser pixel and once
   from our server via the Conversions API — sharing one event id so Meta collapses
   them into a single ViewContent. Events Manager flagged the server as sending far
   fewer events than the pixel, and its cost-per-result guidance keys on that
   coverage rate, not just on Lead accuracy. */
export default function ViewContentTracker({
  name,
  category,
}: {
  name: string
  category?: string
}) {
  useEffect(() => {
    const params = {
      content_name: name,
      content_type: 'project',
      ...(category ? { content_category: category } : {}),
    }
    // null unless cookies were accepted — then neither half reports.
    const eventId = newMetaEventId()
    trackViewContent(params, eventId ?? undefined)
    if (eventId) {
      // Fire-and-forget; a telemetry failure must never disturb the page.
      void reportViewContent(eventId, params).catch(() => {})
    }
  }, [name, category])

  return null
}
