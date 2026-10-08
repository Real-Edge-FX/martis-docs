import { cloneElement, useId, useState, type FormEvent, type ReactElement } from 'react'
import { useLocation } from 'react-router-dom'
import { ContactDeliveryError, submitContact, validateContact, type ContactContext, type ContactErrors, type ContactPayload } from '@/lib/contact'

const initialPayload: ContactPayload = { name: '', email: '', company: '', message: '', consent: false, website: '' }

type Submit = (payload: ContactPayload, context: ContactContext) => Promise<void>

/**
 * The contact form behind /contact (`variant="page"`) and the timed
 * prompt (`variant="compact"`: no company field, shorter copy).
 */
export function ContactForm({ submit = submitContact, variant = 'page', onSubmitted }: { submit?: Submit; variant?: 'page' | 'compact'; onSubmitted?: () => void }) {
  const { pathname } = useLocation()
  const uid = useId()
  const fieldId = (name: string) => `contact-${name}-${uid}`
  const compact = variant === 'compact'
  const [payload, setPayload] = useState(initialPayload)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error' | 'rate_limited'>('idle')
  const update = (field: keyof ContactPayload, value: string | boolean) => {
    setPayload((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateContact(payload)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setStatus('sending')
    try {
      await submit(payload, { source: compact ? 'prompt' : 'contact-page', page: pathname })
      setStatus('success')
      onSubmitted?.()
    } catch (error) {
      setStatus(error instanceof ContactDeliveryError && error.reason === 'rate_limited' ? 'rate_limited' : 'error')
    }
  }

  if (status === 'success') return <div className={`contact-success${compact ? ' contact-success--compact' : ''}`} role="status"><small>Message received</small><h2>Thanks, {payload.name.trim().split(/\s+/)[0]}.</h2><p>Your message is on its way and a confirmation is in your inbox. We’ll reply to {payload.email}.</p></div>

  return <form className={`contact-form${compact ? ' contact-form--compact' : ''}`} onSubmit={handleSubmit} noValidate>
    <div className="contact-form__grid">
      <Field label="Name" error={errors.name}><input id={fieldId('name')} value={payload.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></Field>
      <Field label={compact ? 'Email' : 'Work email'} error={errors.email}><input id={fieldId('email')} type="email" value={payload.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></Field>
    </div>
    {!compact && <Field label="Company (optional)"><input id={fieldId('company')} value={payload.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" /></Field>}
    <Field label={compact ? 'Your question' : 'Project context'} error={errors.message}><textarea id={fieldId('message')} rows={compact ? 3 : 6} value={payload.message} onChange={(event) => update('message', event.target.value)} placeholder={compact ? 'Ask anything about Martis.' : 'What are you building, and where could Martis help?'} /></Field>
    <div className="contact-honeypot" aria-hidden="true"><label htmlFor={fieldId('website')}>Website</label><input id={fieldId('website')} tabIndex={-1} autoComplete="off" value={payload.website} onChange={(event) => update('website', event.target.value)} /></div>
    <label className="contact-consent"><input type="checkbox" checked={payload.consent} onChange={(event) => update('consent', event.target.checked)} /><span>I agree that Martis may use these details to reply to my {compact ? 'question' : 'enquiry'}.</span></label>
    {errors.consent && <p className="field-error">{errors.consent}</p>}
    {status === 'error' && <p className="contact-error" role="alert">We couldn’t send the message. Please try again in a moment.</p>}
    {status === 'rate_limited' && <p className="contact-error" role="alert">We’ve received several messages from you already. Please try again later.</p>}
    <button className="button button--primary contact-submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : compact ? 'Send message' : 'Send project details'}</button>
  </form>
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactElement<{ id?: string }> }) {
  const id = children.props.id
  const errorId = `${id}-error`
  return <div className="contact-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined } as object)}{error && <p id={errorId} className="field-error">{error}</p>}</div>
}
