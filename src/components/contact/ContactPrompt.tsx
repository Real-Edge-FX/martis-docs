import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Icons } from '@/components/icons'
import { ContactForm } from '@/components/contact/ContactForm'
import { CONTACT_PROMPT_DELAY_MS, markContactPromptShown, markContactPromptSubmitted, shouldShowContactPrompt } from '@/lib/contact-prompt'
import type { ContactContext, ContactPayload } from '@/lib/contact'

/**
 * Timed "any questions?" box. Mounted once at the app root, so the delay
 * counts browsing time across route changes. It never opens on /contact
 * (the full form is already there) and waits for the visitor to leave it.
 * Non-modal: it does not take focus or block the page.
 */
export function ContactPrompt({ delay = CONTACT_PROMPT_DELAY_MS, submit }: { delay?: number; submit?: (payload: ContactPayload, context: ContactContext) => Promise<void> }) {
  const { pathname } = useLocation()
  const [due, setDue] = useState(false)
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const onContactPage = pathname === '/contact' || pathname.startsWith('/contact/')

  useEffect(() => {
    const timer = window.setTimeout(() => setDue(true), delay)
    return () => window.clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!due || open || onContactPage) return
    setDue(false)
    if (!shouldShowContactPrompt()) return
    markContactPromptShown()
    setOpen(true)
  }, [due, open, onContactPage])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function close() {
    setClosing(true)
    window.setTimeout(() => { setOpen(false); setClosing(false) }, 180)
  }

  if (!open || onContactPage) return null

  return <aside className={`contact-prompt${closing ? ' is-closing' : ''}`} role="dialog" aria-modal="false" aria-labelledby="contact-prompt-title">
    <div className="contact-prompt__header">
      <img src="/brand/martis-icon.png" alt="" width={34} height={36} />
      <div>
        <h2 id="contact-prompt-title">Any questions about Martis?</h2>
        <p>Ask away. A person from the team replies, usually within a business day.</p>
      </div>
      <button type="button" className="contact-prompt__close" aria-label="Close contact form" onClick={close}><Icons.Close size={16} /></button>
    </div>
    <ContactForm variant="compact" submit={submit} onSubmitted={() => markContactPromptSubmitted()} />
  </aside>
}
