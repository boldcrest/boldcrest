import 'server-only'

/**
 * Cloudflare Turnstile verification for site forms.
 *
 * Free, invisible-by-default CAPTCHA. The secret lives only in the environment
 * (Vercel env var TURNSTILE_SECRET_KEY). If it's not set (e.g. before the
 * Cloudflare widget has been provisioned), verification is skipped so a
 * submission never breaks — the widget itself also only renders client-side
 * when NEXT_PUBLIC_TURNSTILE_SITE_KEY is present.
 */
const secretKey = process.env.TURNSTILE_SECRET_KEY

export async function verifyTurnstile(token: string | null): Promise<boolean> {
  if (!secretKey) return true // not configured yet — don't block submissions
  if (!token) return false

  try {
    const res = await fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ secret: secretKey, response: token }),
      },
    )
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('[turnstile] Verification request failed:', err)
    return false
  }
}
