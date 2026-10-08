export type ContactSource = 'contact-page' | 'prompt'

export interface ContactPayload {
  name: string
  email: string
  company?: string
  message: string
  consent: boolean
  website: string
}

export interface ContactContext {
  source: ContactSource
  page: string
}

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>

/** Same-origin PHP endpoint on getmartis.com (server/contact). VITE_CONTACT_ENDPOINT overrides it for local runs. */
export const CONTACT_ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact.php'

export class ContactDeliveryError extends Error {
  constructor(public readonly reason: 'rate_limited' | 'failed') {
    super(reason === 'rate_limited' ? 'Too many messages' : 'Contact delivery failed')
  }
}

export function validateContact(payload: ContactPayload): ContactErrors {
  const errors: ContactErrors = {}
  if (!payload.name.trim()) errors.name = 'Enter your name.'
  if (!/^\S+@\S+\.\S+$/.test(payload.email)) errors.email = 'Enter a valid email address.'
  if (payload.message.trim().length < 10) errors.message = 'Tell us a little more.'
  if (!payload.consent) errors.consent = 'Confirm that we may use these details to reply.'
  return errors
}

export async function submitContact(payload: ContactPayload, context: ContactContext, fetchImpl: typeof fetch = fetch, endpoint = CONTACT_ENDPOINT) {
  if (!endpoint) throw new Error('Contact delivery is not configured')
  if (payload.website) return
  if (Object.keys(validateContact(payload)).length) throw new Error('Contact details are invalid')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 20000)
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...payload, ...context }),
      signal: controller.signal,
    })
    if (response.status === 429) throw new ContactDeliveryError('rate_limited')
    if (!response.ok) throw new ContactDeliveryError('failed')
  } finally {
    window.clearTimeout(timeout)
  }
}
