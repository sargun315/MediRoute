import { useEffect, useRef, useState } from 'react'
import { Bot, MessageCircle, Send, Trash2, X } from 'lucide-react'

const welcomeMessage = { id: 'welcome', role: 'assistant', text: 'Hello! I can help you find your way around the MediRoute demo.' }

function getFaqAnswer(message) {
  const question = message.toLowerCase()
  if (/appointment|booking|book/.test(question)) return 'To book a demo visit, open Book an appointment from the navigation. Actual availability requires a backend.'
  if (/token|queue|qr/.test(question)) return 'The demo includes queue token pages. A real queue position must be checked by the MediRoute backend.'
  if (/doctor|special|provider/.test(question)) return 'Use Find doctors to browse the demo directory. Provider records shown in the app are sample data.'
  if (/hospital|clinic/.test(question)) return 'Use Find hospitals to browse demo listings. Please contact a facility directly to verify its services.'
  if (/pharmacy|medicine|drug/.test(question)) return 'Use Find pharmacies to browse demo listings. This chat cannot recommend medicines or prescriptions.'
  if (/contact|support|help/.test(question)) return 'Open Contact in the navigation for the demo contact page. No message delivery service is connected.'
  if (/emergency|urgent|chest|breath|bleeding/.test(question)) return 'If this may be an emergency, contact your local emergency services or go to an emergency department now. This demo cannot assess symptoms.'
  return 'I can answer basic questions about appointments, doctors, hospitals, pharmacies, and queue tokens. This is a demo FAQ helper, not an AI service.'
}

export default function Chatbot() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState([welcomeMessage])
  const [error, setError] = useState('')
  const transcriptRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
  }, [messages, open])

  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const send = (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) {
      setError('Enter a message first.')
      inputRef.current?.focus()
      return
    }
    setError('')
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, role: 'user', text },
      { id: `${Date.now()}-answer`, role: 'assistant', text: getFaqAnswer(text) },
    ])
    setDraft('')
  }

  const clearConversation = () => {
    setMessages([welcomeMessage])
    setDraft('')
    setError('')
  }

  return (
    <div className="chatbot-widget">
      {open && (
        <section id="chatbot-panel" className="chatbot-panel" role="dialog" aria-modal="false" aria-labelledby="chatbot-title">
          <header className="chatbot-header">
            <span className="chatbot-avatar"><Bot size={19} aria-hidden="true" /></span>
            <div><h2 id="chatbot-title">MediRoute help</h2><p>Demo FAQ helper</p></div>
            <button type="button" className="chat-icon-button" aria-label="Clear conversation" onClick={clearConversation}><Trash2 size={17} /></button>
            <button type="button" className="chat-icon-button" aria-label="Close chat" onClick={() => setOpen(false)}><X size={19} /></button>
          </header>
          <div className="chatbot-transcript" ref={transcriptRef} role="log" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => <p key={message.id} className={`chat-message ${message.role}`}><span className="sr-only">{message.role === 'assistant' ? 'MediRoute helper' : 'You'}: </span>{message.text}</p>)}
          </div>
          <form className="chatbot-form" onSubmit={send}>
            <label className="sr-only" htmlFor="chatbot-message">Message MediRoute help</label>
            <input id="chatbot-message" ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a general question…" maxLength={400} />
            <button className="button button-primary" type="submit" aria-label="Send message"><Send size={17} /></button>
          </form>
          {error && <p className="chat-error" role="alert">{error}</p>}
          <p className="chatbot-disclaimer">Demo FAQ only. Not medical advice; no diagnosis or prescription help. Do not share personal health information.</p>
        </section>
      )}
      <button className="chatbot-launcher" type="button" aria-label={open ? 'Close MediRoute help chat' : 'Open MediRoute help chat'} aria-expanded={open} aria-controls="chatbot-panel" onClick={() => setOpen((value) => !value)}>
        {open ? <X size={22} aria-hidden="true" /> : <><MessageCircle size={21} aria-hidden="true" /><span>Help</span></>}
      </button>
    </div>
  )
}
