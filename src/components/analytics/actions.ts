'use server'

import { sendViewContentEvent } from '@/lib/meta-capi'

/**
 * Server half of the ViewContent event.
 *
 * Called from ViewContentTracker right after the browser pixel fires, with the
 * SAME event id, so Meta deduplicates the pair into one ViewContent rather than
 * counting the page view twice.
 *
 * The client only produces an id once cookies are accepted, so an empty id here
 * means no consent and nothing is sent — same gate as the Lead path.
 *
 * Deliberately returns nothing and never throws: this is fire-and-forget
 * telemetry hanging off a page view, and it must not be able to surface an
 * error into the page.
 */
export async function reportViewContent(
  eventId: string,
  custom?: Record<string, unknown>,
): Promise<void> {
  if (!eventId) return
  try {
    await sendViewContentEvent({ eventId, custom })
  } catch {
    // sendViewContentEvent already logs; swallow so a view is never disrupted.
  }
}
