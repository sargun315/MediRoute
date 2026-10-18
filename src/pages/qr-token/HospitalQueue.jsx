import { useMemo, useState } from 'react'
import { Building2, CheckCircle2, Clock3, PhoneCall, QrCode, XCircle } from 'lucide-react'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { demoHospitals, findHospital } from '../../services/directoryDemoData.js'
import { listHospitalTokens, updateTokenStatus } from '../../services/tokenDemoService.js'

const queueStatuses = ['all', 'waiting', 'called', 'completed', 'cancelled']
const nextActions = { waiting: [['called', 'Call token'], ['cancelled', 'Cancel token']], called: [['completed', 'Mark completed'], ['cancelled', 'Cancel token']] }

export default function HospitalQueue() {
  const { user } = useAuth()
  const [hospitalId, setHospitalId] = useState('')
  const [department, setDepartment] = useState('all')
  const [status, setStatus] = useState('all')
  const [revision, setRevision] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const hospital = findHospital(hospitalId)
  const departments = useMemo(() => [...new Set(listHospitalTokens(hospitalId).map((token) => token.department).filter(Boolean))].sort(), [hospitalId, revision])
  const queue = useMemo(() => listHospitalTokens(hospitalId, { department, status }), [hospitalId, department, status, revision])

  const changeStatus = (token, nextStatus) => {
    if (nextStatus === 'cancelled' && !window.confirm(`Cancel demo queue token ${token.tokenNumber}?`)) return
    try {
      const result = updateTokenStatus(token.id, nextStatus, user)
      setMessage(result.persisted ? `Token ${token.tokenNumber} updated to ${nextStatus}.` : `Token ${token.tokenNumber} updated for this session only; browser storage is unavailable.`)
      setError(''); setRevision((value) => value + 1)
    } catch (statusError) { setError(statusError instanceof Error ? statusError.message : 'Queue status could not be updated.') }
  }

  return <main className="patient-dashboard-page hospital-queue-page"><div className="patient-dashboard-shell"><Sidebar role={user?.role ?? 'representative'} title="Hospital queue"/><section className="patient-dashboard-content" aria-labelledby="hospital-queue-title"><header className="patient-welcome"><div><span className="eyebrow">HOSPITAL OPERATIONS · DEMO</span><h1 id="hospital-queue-title">Hospital queue</h1><p>Review and update fictional queue records for a selected sample location.</p></div></header><p className="queue-demo-banner"><strong>DEMO DATA</strong> · Not a real-time hospital queue; status changes are stored in this browser only.</p>
    <div className="queue-filter-panel"><label htmlFor="queue-hospital">Hospital or clinic<select id="queue-hospital" value={hospitalId} onChange={(event) => { setHospitalId(event.target.value); setDepartment('all'); setStatus('all'); setMessage(''); setError('') }}><option value="">Choose a sample location</option>{demoHospitals.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.city}</option>)}</select></label><label htmlFor="queue-department">Department<select id="queue-department" value={department} onChange={(event) => setDepartment(event.target.value)} disabled={!hospital}><option value="all">All departments</option>{(hospital?.departments ?? departments).map((item) => <option key={item}>{item}</option>)}</select></label><label htmlFor="queue-status">Token status<select id="queue-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option>{queueStatuses.filter((item) => item !== 'all').map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label></div>
    {message && <p className="token-feedback" role="status">{message}</p>}{error && <p className="token-feedback error" role="alert">{error}</p>}
    {!hospital ? <div className="queue-empty"><Building2 size={24}/><h2>Select a sample hospital or clinic</h2><p>Queue records will appear after you choose a location.</p></div> : queue.length ? <div className="queue-table-wrap"><table className="queue-table"><caption>{hospital.name} · sample queue</caption><thead><tr><th scope="col">Token</th><th scope="col">Department</th><th scope="col">Position</th><th scope="col">Status</th><th scope="col">Update demo status</th></tr></thead><tbody>{queue.map((token) => <tr key={token.id}><th scope="row">{token.tokenNumber}</th><td>{token.department}</td><td>{token.estimatedPosition ?? '—'}</td><td><span className={`status-pill status-${token.status}`}>{token.status}</span></td><td>{(nextActions[String(token.status).toLowerCase()] ?? []).map(([next, label]) => <button className="queue-action-button" type="button" key={next} onClick={() => changeStatus(token, next)}>{next === 'called' ? <PhoneCall size={14}/> : next === 'completed' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {label}</button>)}</td></tr>)}</tbody></table></div> : <div className="queue-empty"><Clock3 size={24}/><h2>No queue records match</h2><p>Try another department or status. New demo tokens appear here after patients generate them.</p></div>}
  </section></div></main>
}
