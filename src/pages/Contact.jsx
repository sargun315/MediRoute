import { Mail, MessageSquareText } from 'lucide-react'
import { useState } from 'react'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const [values, setValues] = useState({ fullName: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)

  const update = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setFeedback(null)
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.fullName.trim()) nextErrors.fullName = 'Enter your name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!values.subject.trim()) nextErrors.subject = 'Enter a subject.'
    if (!values.message.trim()) nextErrors.message = 'Enter a message.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setFeedback({ type: 'error', text: 'Please correct the highlighted fields and try again.' })
      return
    }

    // This frontend demo has no contact endpoint. Do not imply that a message was delivered.
    setFeedback({ type: 'success', text: 'Demo submission recorded in this page only. No email was sent or stored.' })
    setValues({ fullName: '', email: '', subject: '', message: '' })
  }

  const field = (name) => ({
    name,
    value: values[name],
    onChange: update,
    required: true,
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
  })

  return (
    <main className="contact-page">
      <section className="public-page-hero contact-hero">
        <span className="eyebrow"><span className="eyebrow-dot" /> CONTACT MEDIROUTE</span>
        <h1>Let’s make your next step clear.</h1>
        <p>Send a message through this frontend demonstration. The form provides local feedback only; it is not connected to an email service.</p>
      </section>

      <section className="contact-layout page-section" aria-label="Contact form and demo information">
        <aside className="contact-info-card"><span className="purpose-icon"><MessageSquareText size={21} /></span><h2>We’re listening</h2><p>Share feedback about the MediRoute demo experience. Please do not include passwords, personal health details, or other sensitive information.</p><div className="contact-info-note"><Mail size={17} /><span>No support email is connected in this demo.</span></div></aside>

        <form className="contact-form" onSubmit={submit} noValidate aria-labelledby="contact-form-title">
          <h2 id="contact-form-title">Send a message</h2>
          <p className="contact-form-intro">All fields are required for this demo form.</p>
          <div className="contact-field"><label htmlFor="contact-name">Full name</label><input id="contact-name" type="text" autoComplete="name" {...field('fullName')} />{errors.fullName && <span id="fullName-error" className="field-error" role="alert">{errors.fullName}</span>}</div>
          <div className="contact-field"><label htmlFor="contact-email">Email address</label><input id="contact-email" type="email" autoComplete="email" {...field('email')} />{errors.email && <span id="email-error" className="field-error" role="alert">{errors.email}</span>}</div>
          <div className="contact-field"><label htmlFor="contact-subject">Subject</label><input id="contact-subject" type="text" {...field('subject')} />{errors.subject && <span id="subject-error" className="field-error" role="alert">{errors.subject}</span>}</div>
          <div className="contact-field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" rows="5" {...field('message')} />{errors.message && <span id="message-error" className="field-error" role="alert">{errors.message}</span>}</div>
          {feedback && <p className={`contact-feedback ${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>{feedback.text}</p>}
          <button className="button button-primary contact-submit" type="submit">Submit demo message</button>
          <p className="contact-demo-note">Demo only. Submitting does not send or save your message.</p>
        </form>
      </section>
    </main>
  )
}
