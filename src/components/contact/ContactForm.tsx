import { cloneElement, useState, type FormEvent, type ReactElement } from 'react'
import { submitContact, validateContact, type ContactErrors, type ContactPayload } from '@/lib/contact'

const initialPayload: ContactPayload = { name: '', email: '', company: '', project: '', consent: false, website: '' }

export function ContactForm({ submit = submitContact }: { submit?: (payload: ContactPayload) => Promise<void> }) {
  const [payload, setPayload] = useState(initialPayload)
  const [errors, setErrors] = useState<ContactErrors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
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
    try { await submit(payload); setStatus('success') } catch { setStatus('error') }
  }

  if (status === 'success') return <div className="contact-success" role="status"><small>Message received</small><h2>Thanks, {payload.name}.</h2><p>Your project details are on their way. We’ll reply using the email you provided.</p></div>

  return <form className="contact-form" onSubmit={handleSubmit} noValidate>
    <div className="contact-form__grid">
      <Field label="Name" error={errors.name}><input id="contact-name" value={payload.name} onChange={(event) => update('name', event.target.value)} autoComplete="name" /></Field>
      <Field label="Work email" error={errors.email}><input id="contact-email" type="email" value={payload.email} onChange={(event) => update('email', event.target.value)} autoComplete="email" /></Field>
    </div>
    <Field label="Company (optional)"><input id="contact-company" value={payload.company} onChange={(event) => update('company', event.target.value)} autoComplete="organization" /></Field>
    <Field label="Project context" error={errors.project}><textarea id="contact-project" rows={6} value={payload.project} onChange={(event) => update('project', event.target.value)} placeholder="What are you building, and where could Martis help?" /></Field>
    <div className="contact-honeypot" aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" tabIndex={-1} autoComplete="off" value={payload.website} onChange={(event) => update('website', event.target.value)} /></div>
    <label className="contact-consent"><input type="checkbox" checked={payload.consent} onChange={(event) => update('consent', event.target.checked)} /><span>I agree that Martis may use these details to reply to my enquiry.</span></label>
    {errors.consent && <p className="field-error">{errors.consent}</p>}
    {status === 'error' && <p className="contact-error" role="alert">We couldn’t send the message. Please try again in a moment.</p>}
    <button className="button button--primary contact-submit" type="submit" disabled={status === 'sending'}>{status === 'sending' ? 'Sending…' : 'Send project details'}</button>
  </form>
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactElement<{ id?: string }> }) {
  const id = children.props.id
  const errorId = `${id}-error`
  return <div className="contact-field"><label htmlFor={id}>{label}</label>{cloneElement(children, { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? errorId : undefined } as object)}{error && <p id={errorId} className="field-error">{error}</p>}</div>
}
