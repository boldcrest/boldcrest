/**
 * Lightweight bot filters shared by site forms: a honeypot field bots fill in
 * but real visitors never see, plus a minimum fill-time check (no human reads,
 * fills, and submits a form in under a second). Either signal alone is
 * bypassable; together they catch the bulk of scripted spam without ever
 * showing a real visitor a challenge.
 *
 * Callers should treat a positive hit as "pretend success, don't send the
 * email" — silently dropping the submission rather than returning an error,
 * so the bot has no signal to adapt to.
 */
const MIN_FILL_TIME_MS = 1200

export function isLikelyBot(formData: FormData): boolean {
  const honeypot = (formData.get('_gotcha') as string) || ''
  if (honeypot.trim() !== '') return true

  const startedAt = Number(formData.get('_ts'))
  if (!startedAt || Number.isNaN(startedAt)) return true
  if (Date.now() - startedAt < MIN_FILL_TIME_MS) return true

  return false
}
