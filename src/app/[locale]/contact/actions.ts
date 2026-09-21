'use server'

import { sendFormEmail, buildBody } from '@/lib/email'
import { isLikelyBot } from '@/lib/spam-guard'
import { verifyTurnstile } from '@/lib/turnstile'

const TO = 'info@boldcrest.com'

export async function submitContactForm(formData: FormData) {
  // Honeypot + fill-time check: bots get a fake success with no email sent,
  // so there's no error signal for a script to adapt to.
  if (isLikelyBot(formData)) {
    return { success: true }
  }

  // Turnstile: only enforced once TURNSTILE_SECRET_KEY is configured (see
  // lib/turnstile.ts). This one DOES report failure — a real visitor who
  // fails it should be able to see that and retry.
  const turnstileToken = (formData.get('cf-turnstile-response') as string) || null
  const humanVerified = await verifyTurnstile(turnstileToken)
  if (!humanVerified) {
    return { success: false, error: 'Verification failed — please try again.' }
  }

  const data = {
    name: (formData.get('name') as string) || '',
    email: (formData.get('email') as string) || '',
    company: (formData.get('company') as string) || '',
    message: (formData.get('message') as string) || '',
  }

  const { html, text } = buildBody([
    ['Name', data.name],
    ['Email', data.email],
    ['Company', data.company],
    ['Message', data.message],
  ])

  await sendFormEmail({
    to: TO,
    subject: 'Contact Form Submission - WebsiteForms - BoldCrest',
    replyTo: data.email || undefined,
    html: `<h2 style="font-family:Arial,sans-serif;font-size:18px">New Contact Form Submission - BoldCrest</h2>${html}`,
    text: `New Contact Form Submission - BoldCrest\n\n${text}`,
  })

  // Always report success to the visitor; delivery failures are logged
  // server-side (and a missing API key degrades gracefully).
  return { success: true }
}
