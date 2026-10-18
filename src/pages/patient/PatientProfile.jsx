import { BadgeCheck, MapPin, Save, UserRound, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[\d\s().-]{7,30}$/

function profileValues(user) {
  return { fullName: user?.fullName ?? '', email: user?.email ?? '', phone: user?.phone ?? '', city: user?.city ?? '' }
}

export default function PatientProfile() {
  const { user, updateProfile, storageWarning } = useAuth()
  const [values, setValues] = useState(() => profileValues(user))
  const [errors, setErrors] = useState({})
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    setValues(profileValues(user))
  }, [user?.id, user?.fullName, user?.email, user?.phone, user?.city])

  const change = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setMessage(null)
  }

  const cancel = () => {
    setValues(profileValues(user))
    setErrors({})
    setMessage(null)
    setEditing(false)
  }

  const startEditing = (event) => {
    event.preventDefault()
    setMessage(null)
    setEditing(true)
  }

  const save = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (values.fullName.trim().length < 2) nextErrors.fullName = 'Enter your full name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (values.phone.trim() && (!phonePattern.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7)) nextErrors.phone = 'Enter at least 7 digits, or leave this field blank.'
    if (values.city.trim().length > 80) nextErrors.city = 'City must be 80 characters or fewer.'
    setErrors(nextErrors)
    setMessage(null)
    if (Object.keys(nextErrors).length) return

    try {
      updateProfile(values)
      setEditing(false)
      setMessage({ type: 'success', text: 'Your demo profile has been updated.' })
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'The demo profile could not be updated.' })
    }
  }

  const renderField = (name, label, type = 'text', autoComplete, optional = false) => (
    <div className="profile-field" key={name}>
      <label htmlFor={`patient-${name}`}>{label}{optional && <span> (optional)</span>}</label>
      <input id={`patient-${name}`} name={name} type={type} value={values[name]} onChange={change} autoComplete={autoComplete} disabled={!editing} required={!optional} maxLength={name === 'city' ? 80 : undefined} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `patient-${name}-error` : undefined} />
      {errors[name] && <span id={`patient-${name}-error`} className="field-error" role="alert">{errors[name]}</span>}
    </div>
  )

  return (
    <main className="patient-dashboard-page patient-profile-page">
      <div className="patient-dashboard-shell">
        <Sidebar role="patient" title="Patient dashboard" />
        <section className="patient-dashboard-content" aria-labelledby="profile-title">
          <div className="patient-welcome profile-welcome"><div><span className="eyebrow">ACCOUNT DETAILS · DEMO</span><h1 id="profile-title">Patient profile</h1><p>Manage the basic contact details for this frontend demo account.</p></div><span className="profile-badge"><BadgeCheck size={17} /> Demo profile</span></div>
          <div className="profile-privacy-note" role="note"><UserRound size={18} /><p>This profile is demo data stored in browser storage. Use sample contact details only. Do not add passwords or health information.</p></div>

          <form className="patient-profile-card" onSubmit={save} noValidate>
            <div className="profile-card-heading"><span className="patient-stat-icon teal"><UserRound size={20} /></span><div><h2>Personal information</h2><p>Only basic contact details are requested.</p></div></div>
            <div className="profile-fields-grid">
              {renderField('fullName', 'Full name', 'text', 'name')}
              {renderField('email', 'Email address', 'email', 'email')}
              {renderField('phone', 'Phone number', 'tel', 'tel')}
              <div className="profile-field city-field"><label htmlFor="patient-city">City <span>(optional)</span></label><div className="profile-input-with-icon"><MapPin size={16} aria-hidden="true" /><input id="patient-city" name="city" type="text" value={values.city} onChange={change} autoComplete="address-level2" disabled={!editing} maxLength={80} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'patient-city-error' : undefined} /></div>{errors.city && <span id="patient-city-error" className="field-error" role="alert">{errors.city}</span>}</div>
            </div>
            {message && <p className={`profile-feedback ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>{message.text}</p>}
            {storageWarning && <p className="auth-storage-warning" role="status">{storageWarning}</p>}
            <div className="profile-actions">
              {editing ? <><button className="button button-primary" type="submit"><Save size={16} /> Save changes</button><button className="button button-outline" type="button" onClick={cancel}><X size={16} /> Cancel editing</button></> : <button className="button button-primary" type="button" onClick={startEditing}><UserRound size={16} /> Edit profile</button>}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
