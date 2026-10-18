import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, ArrowRight, CalendarDays, Clock3, Video } from 'lucide-react'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { listConsultationHistory } from '../../services/consultationDemoService.js'

function formatDate(value) {
  if (!value) return 'Date not provided'
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value)
  return Number.isNaN(date.getTime()) ? 'Date not provided' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return 'Not available'
  const value = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(value / 60)
  const remainder = value % 60
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

export default function ConsultationHistory() {
  const { user } = useAuth()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    try { setRecords(listConsultationHistory(user?.id)); setError('') }
    catch { setRecords([]); setError('Consultation history could not be loaded.') }
    finally { setLoading(false) }
  }, [user?.id])

  return (
    <main className="patient-dashboard-page consultation-page">
      <div className="patient-dashboard-shell">
        <Sidebar role="patient" title="Consultations" />
        <section className="patient-dashboard-content" aria-labelledby="consultation-history-title">
          <header className="patient-welcome consultation-welcome">
            <div><span className="eyebrow">PATIENT RECORDS · DEMO</span><h1 id="consultation-history-title">Consultation history</h1><p>Review local demo sessions associated with your account.</p></div>
            <Link className="button button-outline" to="/consultation"><Video size={16} aria-hidden="true"/> Available consultations</Link>
          </header>
          <p className="consultation-demo-banner"><strong>DEMO DATA:</strong> This list is stored in this browser. It does not show calls from a provider or another patient.</p>
          {error && <p className="consultation-feedback error" role="alert">{error}</p>}
          {loading ? <p className="consultation-empty" role="status">Loading consultation history…</p> : records.length ? <div className="consultation-history-list">
            {records.map((record) => {
              const appointment = record.appointment ?? {}
              const provider = appointment.doctor?.name ?? appointment.doctorName ?? appointment.hospital?.name ?? appointment.hospitalName ?? 'Provider not listed'
              const active = record.status === 'active'
              const destination = `/consultation/${encodeURIComponent(record.appointmentReference ?? appointment.reference ?? record.appointmentId)}`
              return <article className="consultation-history-card" key={record.id}>
                <div className="consultation-history-icon"><Activity size={20} aria-hidden="true"/></div>
                <div className="consultation-history-main"><span className="eyebrow">{appointment.reference ?? record.appointmentReference ?? 'Appointment reference unavailable'}</span><h2>{provider}</h2><p>{appointment.hospital?.name ?? 'Hospital not provided'} · {formatDate(record.startedAt)}</p></div>
                <dl className="consultation-history-meta"><div><dt>Status</dt><dd><span className={`consultation-status status-${record.status}`}>{active ? 'Active demo session' : 'Ended'}</span></dd></div><div><dt><Clock3 size={14} aria-hidden="true"/> Duration</dt><dd>{active ? 'In progress' : formatDuration(record.durationSeconds)}</dd></div><div><dt><CalendarDays size={14} aria-hidden="true"/> Appointment</dt><dd>{formatDate(appointment.date)}</dd></div></dl>
                <Link className="button button-outline" to={destination}>{active ? 'Join session' : 'View session'} <ArrowRight size={15} aria-hidden="true"/></Link>
              </article>
            })}
          </div> : <div className="consultation-empty"><Activity size={25} aria-hidden="true"/><h2>No consultation history yet</h2><p>When you start a demo session for an eligible online appointment, it will appear here.</p><Link className="button button-primary" to="/consultation">Find an eligible appointment</Link></div>}
        </section>
      </div>
    </main>
  )
}
