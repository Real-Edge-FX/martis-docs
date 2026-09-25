import { describe, expect, it, vi } from 'vitest'
import { submitContact, validateContact, type ContactPayload } from './contact'

const valid: ContactPayload = { name: 'Ana', email: 'ana@example.com', company: 'Studio', project: 'A client operations platform.', consent: true, website: '' }

describe('contact delivery', () => {
  it('validates required fields and consent', () => {
    expect(validateContact({ ...valid, email: 'invalid', consent: false })).toEqual(expect.objectContaining({ email: expect.any(String), consent: expect.any(String) }))
    expect(validateContact(valid)).toEqual({})
  })

  it('posts valid contact data to the configured endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    await submitContact(valid, fetchImpl, 'https://forms.example.test/contact')
    expect(fetchImpl).toHaveBeenCalledWith('https://forms.example.test/contact', expect.objectContaining({ method: 'POST' }))
  })

  it('fails safely when delivery is unavailable', async () => {
    await expect(submitContact(valid, vi.fn(), '')).rejects.toThrow('Contact delivery is not configured')
  })
})
