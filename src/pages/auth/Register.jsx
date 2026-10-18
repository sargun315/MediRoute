import { useState } from 'react'
import { Eye, EyeOff, HeartPulse, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { DEMO_PASSCODE, getDashboardPath, ROLE_LABELS, USER_ROLES } from '../../utils/constants.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^\+?[\d\s().-]{7,20}$/
const supportedRoles = new Set(Object.values(USER_ROLES))

export default function Register() {
  const { register, storageWarning } = useAuth()
  const [values, setValues] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: USER_ROLES.PATIENT, acceptedTerms: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [createdUser, setCreatedUser] = useState(null)

  const update = (field) => (event) => {
    const value = field === 'acceptedTerms' ? event.target.checked : event.target.value
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setFormError('')
  }

  const validate = () => {
    const nextErrors = {}
    if (values.fullName.trim().length < 2) nextErrors.fullName = 'Enter your full name.'
    if (!values.email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(values.email.trim())) nextErrors.email = 'Enter a valid email address.'
    if (!values.phone.trim()) nextErrors.phone = 'Enter a phone number for this demo form.'
    else if (!phonePattern.test(values.phone.trim()) || values.phone.replace(/\D/g, '').length < 7) nextErrors.phone = 'Enter at least 7 digits, with an optional +, spaces, or parentheses.'
    if (values.password.length < 8) nextErrors.password = 'Use at least 8 characters to pass the demo form validation.'
    if (!values.confirmPassword) nextErrors.confirmPassword = 'Confirm the password you entered.'
    else if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'The passwords do not match.'
    if (!supportedRoles.has(values.role)) nextErrors.role = 'Choose a demo role.'
    if (!values.acceptedTerms) nextErrors.acceptedTerms = 'Accept the demo account terms to continue.'
    return nextErrors
  }

  const submit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    try {
      const user = register({ fullName: values.fullName, email: values.email, phone: values.phone, role: values.role })
      setCreatedUser(user)
      // Do not keep the typed phone or password in this component after registration.
      setValues((current) => ({ ...current, phone: '', password: '', confirmPassword: '' }))
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'The demo account could not be created.')
    }
  }

  if (createdUser) {
    return (
      <main className="auth-page">
        <section className="auth-panel auth-success-panel" aria-labelledby="register-success-title">
          <span className="auth-logo"><HeartPulse size={23} aria-hidden="true" /></span>
          <span className="eyebrow">DEMO ACCOUNT READY</span>
          <h1 id="register-success-title">You’re signed in, {createdUser.fullName}.</h1>
          <p className="auth-success-message">Your demo profile is saved. Your phone and the password you entered were discarded. For your next demo sign in, use the shared passcode <code>{DEMO_PASSCODE}</code>.</p>
          {storageWarning && <p className="auth-storage-warning" role="status">{storageWarning}</p>}
          <Link className="button button-primary auth-submit" to={getDashboardPath(createdUser.role)}>Continue to {ROLE_LABELS[createdUser.role]} dashboard</Link>
          <p className="auth-security-note">This is frontend-only demo authentication. Real account registration requires a secure backend.</p>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-register-panel" aria-labelledby="register-title">
        <div className="auth-heading">
          <span className="auth-logo"><HeartPulse size={23} aria-hidden="true" /></span>
          <span className="eyebrow">JOIN MEDIROUTE</span>
          <h1 id="register-title">Create a demo account</h1>
          <p>Choose a role to explore the matching dashboard.</p>
        </div>
        <div className="demo-credentials"><strong>Demo only:</strong> Use sample contact details. Password and phone are checked by this form, then discarded. The shared passcode for later demo sign in is <code>{DEMO_PASSCODE}</code>.</div>

        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="form-field">
            <label htmlFor="register-name">Full name</label>
            <input id="register-name" type="text" autoComplete="name" value={values.fullName} onChange={update('fullName')} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'register-name-error' : undefined} required />
            {errors.fullName && <span id="register-name-error" className="field-error" role="alert">{errors.fullName}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="register-email">Email address</label>
            <input id="register-email" type="email" autoComplete="email" value={values.email} onChange={update('email')} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'register-email-error' : undefined} required />
            {errors.email && <span id="register-email-error" className="field-error" role="alert">{errors.email}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="register-phone">Phone number</label>
            <input id="register-phone" type="tel" autoComplete="tel" value={values.phone} onChange={update('phone')} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'register-phone-error' : undefined} required />
            {errors.phone && <span id="register-phone-error" className="field-error" role="alert">{errors.phone}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="register-role">Demo role</label>
            <select id="register-role" value={values.role} onChange={update('role')} aria-invalid={Boolean(errors.role)} required>
              {Object.entries(ROLE_LABELS).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
            </select>
            {errors.role && <span className="field-error" role="alert">{errors.role}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="register-password">Password</label>
            <div className="password-input-wrap">
              <input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.password} onChange={update('password')} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'register-password-error' : 'register-password-help'} required />
              <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <span id="register-password-help" className="field-help">At least 8 characters. This value is not saved.</span>
            {errors.password && <span id="register-password-error" className="field-error" role="alert">{errors.password}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="register-confirm-password">Confirm password</label>
            <div className="password-input-wrap">
              <input id="register-confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirmPassword} onChange={update('confirmPassword')} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined} required />
              <button className="password-toggle" type="button" aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'} aria-pressed={showConfirmPassword} onClick={() => setShowConfirmPassword((value) => !value)}>{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.confirmPassword && <span id="register-confirm-error" className="field-error" role="alert">{errors.confirmPassword}</span>}
          </div>
          <div className="terms-field">
            <input id="register-terms" type="checkbox" checked={values.acceptedTerms} onChange={update('acceptedTerms')} aria-invalid={Boolean(errors.acceptedTerms)} aria-describedby={errors.acceptedTerms ? 'register-terms-error' : undefined} />
            <label htmlFor="register-terms">I understand this is a frontend demo and will use sample information only.</label>
          </div>
          {errors.acceptedTerms && <span id="register-terms-error" className="field-error" role="alert">{errors.acceptedTerms}</span>}
          {formError && <p className="auth-error" role="alert">{formError}</p>}
          {storageWarning && <p className="auth-storage-warning" role="status">{storageWarning}</p>}
          <button className="button button-primary auth-submit" type="submit"><UserPlus size={17} aria-hidden="true" /> Create demo account</button>
        </form>
        <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        <p className="auth-security-note">Real registration needs a secure backend. This demo never stores passwords or medical information.</p>
      </section>
    </main>
  )
}
