export interface ContactPayload {
  name: string
  email: string
  company?: string
  project: string
  consent: boolean
  website: string
}

export type ContactErrors = Partial<Record<keyof ContactPayload, string>>

export function validateContact(payload: ContactPayload): ContactErrors {
  const errors: ContactErrors = {}
  if (!payload.name.trim()) errors.name = 'Enter your name.'
  if (!/^\S+@\S+\.\S+$/.test(payload.email)) errors.email = 'Enter a valid email address.'
  if (payload.project.trim().length < 20) errors.project = 'Tell us a little more about the project.'
  if (!payload.consent) errors.consent = 'Confirm that we may use these details to reply.'
  return errors
}

export async function submitContact(payload: ContactPayload, fetchImpl: typeof fetch = fetch, endpoint = import.meta.env.VITE_CONTACT_ENDPOINT ?? '') {
  if (!endpoint) throw new Error('Contact delivery is not configured')
  if (payload.website) return
  if (Object.keys(validateContact(payload)).length) throw new Error('Contact details are invalid')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 10000)
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...payload, consent: payload.consent ? 'yes' : 'no', _subject: 'New Martis project enquiry' }),
      signal: controller.signal,
    })
    if (!response.ok) throw new Error('Contact delivery failed')
  } finally {
    window.clearTimeout(timeout)
  }
}
