import { describe, expect, it, vi } from 'vitest'
import { ContactDeliveryError, submitContact, validateContact, type ContactPayload } from './contact'

const valid: ContactPayload = { name: 'Ana', email: 'ana@example.com', company: 'Studio', message: 'A client operations platform.', consent: true, website: '' }
const context = { source: 'contact-page', page: '/contact' } as const

describe('contact delivery', () => {
  it('validates required fields and consent', () => {
    expect(validateContact({ ...valid, email: 'invalid', consent: false, message: 'short' })).toEqual(expect.objectContaining({ email: expect.any(String), consent: expect.any(String), message: expect.any(String) }))
    expect(validateContact(valid)).toEqual({})
  })

  it('posts the message and its context as JSON to the endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    await submitContact(valid, context, fetchImpl, '/api/contact.php')
    expect(fetchImpl).toHaveBeenCalledWith('/api/contact.php', expect.objectContaining({ method: 'POST' }))
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({ ...valid, ...context })
  })

  it('defaults to the same-origin PHP endpoint', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    await submitContact(valid, context, fetchImpl)
    expect(fetchImpl.mock.calls[0][0]).toBe('/api/contact.php')
  })

  it('never posts when the honeypot is filled', async () => {
    const fetchImpl = vi.fn()
    await submitContact({ ...valid, website: 'spam' }, context, fetchImpl, '/api/contact.php')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('reports rate limiting separately from other failures', async () => {
    await expect(submitContact(valid, context, vi.fn().mockResolvedValue({ ok: false, status: 429 }), '/api')).rejects.toEqual(new ContactDeliveryError('rate_limited'))
    await expect(submitContact(valid, context, vi.fn().mockResolvedValue({ ok: false, status: 502 }), '/api')).rejects.toEqual(new ContactDeliveryError('failed'))
  })
})
