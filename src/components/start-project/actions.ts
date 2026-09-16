'use server'

import { sendFormEmail, buildBody } from '@/lib/email'
import { createOpportunity } from '@/lib/clickup'
import { isLikelyBot } from '@/lib/spam-guard'
import { verifyTurnstile } from '@/lib/turnstile'

const TO = 'sales@boldcrest.com'

export async function submitProjectForm(formData: FormData) {
  // See src/app/contact/actions.ts for the shared reasoning on both checks.
  if (isLikelyBot(formData)) {
    return { success: true }
  }

  const turnstileToken = (formData.get('cf-turnstile-response') as string) || null
  const humanVerified = await verifyTurnstile(turnstileToken)
  if (!humanVerified) {
    return { success: false, error: 'Verification failed — please try again.' }
  }

  const data = {
    name: (formData.get('name') as string) || '',
    position: (formData.get('position') as string) || '',
    company: (formData.get('company') as string) || '',
    email: (formData.get('email') as string) || '',
    services: (formData.get('services') as string) || '',
    message: (formData.get('message') as string) || '',
    kickoff: (formData.get('kickoff') as string) || '',
    deadline: (formData.get('deadline') as string) || '',
    budget: (formData.get('budget') as string) || '',
    source: (formData.get('source') as string) || '',
  }

  const { html, text } = buildBody([
    ['Name', data.name],
    ['Position', data.position],
    ['Company', data.company],
    ['Email', data.email],
    ['Services', data.services],
    ['Message', data.message],
    ['Kickoff', data.kickoff],
    ['Deadline', data.deadline],
    ['Budget', data.budget],
    ['Heard about us', data.source],
  ])

  // Run both in parallel; neither failure should block the visitor's success
  // state (each logs + degrades gracefully on a missing key/token).
  await Promise.allSettled([
    sendFormEmail({
      to: TO,
      subject: 'Sales Form Submission - WebsiteForms - BoldCrest',
      replyTo: data.email || undefined,
      html: `<h2 style="font-family:Arial,sans-serif;font-size:18px">New Sales Form Submission - BoldCrest</h2>${html}`,
      text: `New Sales Form Submission - BoldCrest\n\n${text}`,
    }),
    // Create a matching Opportunity in the ClickUp sales pipeline.
    createOpportunity(data),
  ])

  return { success: true }
}
