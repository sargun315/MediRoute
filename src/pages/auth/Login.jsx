import { useState } from 'react'
import { Eye, EyeOff, HeartPulse, LogIn } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { canRoleAccessPath, DEMO_ACCOUNTS, DEMO_PASSCODE, getDashboardPath, ROLE_LABELS } from '../../utils/constants.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getPostLoginPath(role, from) {
  if (!from || typeof from.pathname !== 'string') return getDashboardPath(role)
  if (!canRoleAccessPath(role, from.pathname)) return getDashboardPath(role)
  return `${from.pathname}${from.search ?? ''}${from.hash ?? ''}`
}

export default function Login() {
  const { login, storageWarning } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  const chooseDemoAccount = (account) => {
    setEmail(account.email)
    setPassword(DEMO_PASSCODE)
    setErrors({})
    setFormError('')
  }

  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!email.trim()) nextErrors.email = 'Enter your email address.'
    else if (!emailPattern.test(email.trim())) nextErrors.email = 'Enter an email address in the format name@example.com.'
    if (!password) nextErrors.password = 'Enter the demo passcode.'
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length) return

    setLoading(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 200))
      const user = login({ email, password })
      navigate(getPostLoginPath(user.role, location.state?.from), { replace: true })
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Demo sign in could not be completed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-heading">
          <span className="auth-logo"><HeartPulse size={23} aria-hidden="true" /></span>
          <span className="eyebrow">WELCOME TO MEDIROUTE</span>
          <h1 id="login-title">Sign in to your demo account</h1>
          <p>Use a sample account to explore the role-based demo pages.</p>
        </div>

        <div className="demo-credentials" aria-label="Demo sign-in information">
          <strong>Shared demo passcode:</strong> <code>{DEMO_PASSCODE}</code>
          <p>This is a public frontend demo. Do not enter a real password.</p>
        </div>

        <div className="demo-account-list" aria-label="Choose a sample account">
          {DEMO_ACCOUNTS.map((account) => (
            <button key={account.id} className="demo-account-button" type="button" onClick={() => chooseDemoAccount(account)}>
              <span>{ROLE_LABELS[account.role]}</span><strong>{account.email}</strong>
            </button>
          ))}
        </div>

        <form className="auth-form" onSubmit={submit} noValidate>
          <div className="form-field">
            <label htmlFor="login-email">Email address</label>
            <input id="login-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'login-email-error' : undefined} required />
            {errors.email && <span id="login-email-error" className="field-error" role="alert">{errors.email}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <div className="password-input-wrap">
              <input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? 'login-password-error' : undefined} required />
              <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            {errors.password && <span id="login-password-error" className="field-error" role="alert">{errors.password}</span>}
          </div>
          {formError && <p className="auth-error" role="alert">{formError}</p>}
          {storageWarning && <p className="auth-storage-warning" role="status">{storageWarning}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={loading}>
            <LogIn size={17} aria-hidden="true" /> {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">New to MediRoute? <Link to="/register">Create a demo account</Link></p>
        <p className="auth-security-note">Demo navigation only. This frontend does not verify identity or protect healthcare data.</p>
      </section>
    </main>
  )
}
