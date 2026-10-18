import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Building2, QrCode, UserRound } from 'lucide-react'
import QRCodeDisplay from '../../components/QRCodeDisplay.jsx'
import TokenCard from '../../components/TokenCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { demoHospitals, findHospital } from '../../services/directoryDemoData.js'
import { createToken } from '../../services/tokenDemoService.js'

export default function GenerateToken() {
  const { user } = useAuth()
  const [params] = useSearchParams()
  const [hospitalId, setHospitalId] = useState(() => findHospital(params.get('hospitalId'))?.id ?? '')
  const [department, setDepartment] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [token, setToken] = useState(null)
  const [storageNotice, setStorageNotice] = useState('')
  const hospital = findHospital(hospitalId)
  const departments = Array.isArray(hospital?.departments) ? hospital.departments : []

  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const nextErrors = {}
    if (!findHospital(hospitalId)) nextErrors.hospital = 'Choose a hospital or clinic.'
    if (departments.length && !departments.includes(department)) nextErrors.department = 'Choose a department.'
    setErrors(nextErrors); setMessage('')
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180))
      const result = createToken({ hospitalId, department }, user)
      setToken(result.token)
      setStorageNotice(result.persisted ? '' : 'Browser storage is unavailable. This token will be available only for this session.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The demo token could not be generated.')
    } finally { setSubmitting(false) }
  }

  if (token) return <main className="token-page"><div className="token-confirmation-layout"><section className="token-confirmation"><span className="token-success-icon"><QrCode size={25}/></span><span className="eyebrow">DEMO TOKEN GENERATED</span><h1>Your sample queue token is ready</h1><p>This creates a browser demo record only. It does not reserve a place in a real hospital queue.</p><TokenCard token={token}/><dl className="token-confirmation-details"><div><dt>Token ID</dt><dd>{token.id}</dd></div><div><dt>Hospital or clinic</dt><dd>{token.hospital}</dd></div><div><dt>Department</dt><dd>{token.department}</dd></div><div><dt>Created</dt><dd>{new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(token.createdAt))}</dd></div></dl>{storageNotice && <p className="token-feedback" role="status">{storageNotice}</p>}<div className="token-action-row"><Link className="button button-primary" to="/tokens">My Tokens</Link><Link className="button button-outline" to={`/tokens/${encodeURIComponent(token.reference)}`}>View token details</Link></div></section><QRCodeDisplay token={token} title="Your demo token QR code"/></div></main>

  return <main className="token-page"><div className="token-form-shell"><header className="token-page-heading"><span className="eyebrow">QUEUE TOOLS · DEMO</span><h1>Generate a queue token</h1><p>Choose a sample hospital and department to create a local demo token.</p></header><p className="token-demo-note" role="note"><strong>DEMO DATA.</strong> This does not create a real hospital reservation or show a live queue.</p>
    <form className="token-form-card" onSubmit={submit} noValidate><div className="token-patient-summary"><UserRound size={19}/><div><span>Signed-in demo patient</span><strong>{user?.fullName || 'Patient'}</strong><small>{user?.email || 'Patient account'}</small></div></div>
      <div className="token-field"><label htmlFor="token-hospital">Hospital or clinic</label><select id="token-hospital" value={hospitalId} onChange={(event) => { setHospitalId(event.target.value); setDepartment(''); setErrors({}) }} aria-invalid={Boolean(errors.hospital)} aria-describedby={errors.hospital ? 'token-hospital-error' : undefined}><option value="">Choose a sample hospital/clinic</option>{demoHospitals.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}</select>{errors.hospital && <span id="token-hospital-error" className="token-field-error" role="alert">{errors.hospital}</span>}</div>
      {hospital && departments.length > 0 ? <div className="token-field"><label htmlFor="token-department">Department</label><select id="token-department" value={department} onChange={(event) => { setDepartment(event.target.value); setErrors((current) => ({ ...current, department: undefined })) }} aria-invalid={Boolean(errors.department)} aria-describedby={errors.department ? 'token-department-error' : undefined}><option value="">Choose a department</option>{departments.map((item) => <option key={item}>{item}</option>)}</select>{errors.department && <span id="token-department-error" className="token-field-error" role="alert">{errors.department}</span>}</div> : hospital && <p className="token-demo-note">No department list is available for this sample listing.</p>}
      {hospital && <section className="token-hospital-preview"><Building2 size={18}/><div><strong>{hospital.name}</strong><span>{hospital.location || hospital.city}</span></div></section>}
      {message && <p className="token-feedback error" role="alert">{message}</p>}
      <button className="button button-primary token-submit" type="submit" disabled={submitting}>{submitting ? 'Creating demo token…' : 'Generate DEMO token'}</button>
      <p className="token-form-footnote">Only a token reference and queue information are encoded in the QR. No patient name, password, or medical details are included.</p>
    </form></div></main>
}
