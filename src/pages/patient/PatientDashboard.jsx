import { Activity, ArrowRight, Building2, CalendarDays, CheckCircle2, Clock3, MapPin, Pill, QrCode, Stethoscope, UserRoundPen, UsersRound, Video } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import AppointmentCard from '../../components/AppointmentCard.jsx'
import Sidebar from '../../components/Sidebar.jsx'
import TokenCard from '../../components/TokenCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { calculatePatientDashboardStats, getPatientDemoRecords, getRecentPatientActivity, isUpcomingPatientAppointment } from '../../services/patientDemoData.js'
import { listAppointments } from '../../services/appointmentDemoService.js'
import { listPatientTokens } from '../../services/tokenDemoService.js'

const quickActions = [
  { label: 'Find doctors', detail: 'Browse provider listings', to: '/doctors', Icon: Stethoscope },
  { label: 'Find hospitals', detail: 'Explore hospital information', to: '/hospitals', Icon: Building2 },
  { label: 'Find pharmacies', detail: 'View pharmacy listings', to: '/pharmacies', Icon: Pill },
  { label: 'Book appointment', detail: 'Open the appointment flow', to: '/appointments/book', Icon: CalendarDays },
  { label: 'Generate queue token', detail: 'Open the token demo', to: '/tokens/generate', Icon: QrCode },
  { label: 'View my appointments', detail: 'See appointment records', to: '/appointments', Icon: Clock3 },
  { label: 'View my tokens', detail: 'See queue token records', to: '/tokens', Icon: Activity },
  { label: 'Consultation history', detail: 'Review local demo sessions', to: '/consultation/history', Icon: Video },
  { label: 'Edit patient profile', detail: 'Update your demo details', to: '/patient/profile', Icon: UserRoundPen },
]

const statItems = [
  { key: 'totalAppointments', label: 'Total appointments', Icon: CalendarDays, tone: 'blue' },
  { key: 'upcomingAppointments', label: 'Upcoming', Icon: Clock3, tone: 'teal' },
  { key: 'completedAppointments', label: 'Completed', Icon: CheckCircle2, tone: 'green' },
  { key: 'activeTokens', label: 'Active queue tokens', Icon: QrCode, tone: 'purple' },
]

function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(date)
}

function formatActivityDate(value) {
  if (!value) return 'Date not provided'
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? 'Date not provided' : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const records = useMemo(() => ({ ...getPatientDemoRecords(), appointments: listAppointments(user?.id), tokens: listPatientTokens(user?.id) }), [user?.id])
  const stats = useMemo(() => calculatePatientDashboardStats(records), [records])
  const appointments = useMemo(() => records.appointments
    .filter((appointment) => isUpcomingPatientAppointment(appointment))
    .sort((a, b) => String(a.date).localeCompare(String(b.date))), [records])
  const activeTokens = useMemo(() => records.tokens.filter((token) => ['active', 'waiting', 'in progress', 'in-progress', 'queued'].includes(String(token.status).toLowerCase())), [records])
  const activity = useMemo(() => getRecentPatientActivity(records), [records])
  const displayName = user?.fullName?.trim() || 'Patient'

  return (
    <main className="patient-dashboard-page">
      <div className="patient-dashboard-shell">
        <Sidebar role="patient" title="Patient dashboard" />
        <div className="patient-dashboard-content">
          <section className="patient-welcome" aria-labelledby="patient-welcome-title">
            <div><span className="eyebrow">PATIENT OVERVIEW · DEMO</span><h1 id="patient-welcome-title">Welcome, {displayName}</h1><p>Your care-planning tools and sample activity are gathered here.</p></div>
            <div className="welcome-date"><CalendarDays size={18} aria-hidden="true" /><time dateTime={new Date().toISOString().slice(0, 10)}>{formatDate(new Date())}</time></div>
          </section>

          <p className="dashboard-demo-note" role="note">Demo dashboard: all appointment and queue records below are illustrative sample data, not live patient records.</p>

          <section className="patient-stats-grid" aria-label="Dashboard statistics">
            {statItems.map(({ key, label, Icon, tone }) => <article className="patient-stat-card" key={key}>
              <span className={`patient-stat-icon ${tone}`}><Icon size={19} aria-hidden="true" /></span><span className="patient-stat-value">{stats[key] ?? 0}</span><span className="patient-stat-label">{label}</span>
            </article>)}
          </section>

          <section className="patient-section" aria-labelledby="quick-actions-title">
            <div className="patient-section-heading"><div><span className="eyebrow">GET STARTED</span><h2 id="quick-actions-title">Quick actions</h2></div></div>
            <div className="patient-actions-grid">{quickActions.map(({ label, detail, to, Icon }) => <Link className="patient-action" to={to} key={to}>
              <span className="patient-action-icon"><Icon size={19} aria-hidden="true" /></span><span className="patient-action-text"><strong>{label}</strong><small>{detail}</small></span><ArrowRight className="patient-action-arrow" size={16} aria-hidden="true" />
            </Link>)}</div>
          </section>

          <div className="patient-records-grid">
            <section className="patient-section patient-record-section" aria-labelledby="upcoming-title">
              <div className="patient-section-heading"><div><span className="eyebrow">YOUR VISITS</span><h2 id="upcoming-title">Upcoming appointments</h2></div><Link to="/appointments" className="patient-text-link">View all <ArrowRight size={14} /></Link></div>
              {appointments.length ? <div className="patient-card-list">{appointments.map((appointment) => <AppointmentCard key={appointment.id ?? appointment.reference} appointment={appointment} />)}</div> : <div className="patient-empty-state"><CalendarDays size={22} /><h3>No upcoming appointments</h3><p>When appointment records are available, they will appear here.</p><Link className="button button-outline" to="/appointments/book">Explore appointments</Link></div>}
            </section>

            <section className="patient-section patient-record-section" aria-labelledby="tokens-title">
              <div className="patient-section-heading"><div><span className="eyebrow">VISIT QUEUE</span><h2 id="tokens-title">Active queue tokens</h2></div><Link to="/tokens" className="patient-text-link">View all <ArrowRight size={14} /></Link></div>
              {activeTokens.length ? <div className="patient-card-list">{activeTokens.map((token) => <TokenCard key={token.id ?? token.reference} token={token} />)}</div> : <div className="patient-empty-state"><QrCode size={22} /><h3>No active queue tokens</h3><p>Active demo queue tokens will appear here when available.</p><Link className="button button-outline" to="/tokens/generate">Generate a token</Link></div>}
            </section>
          </div>

          <section className="patient-section patient-activity-section" aria-labelledby="activity-title">
            <div className="patient-section-heading"><div><span className="eyebrow">RECENT UPDATES</span><h2 id="activity-title">Recent activity</h2></div></div>
            {activity.length ? <ol className="patient-activity-list">{activity.map((item) => <li key={item.id}>
              <span className={`activity-icon ${item.type}`} aria-hidden="true">{item.type === 'token' ? <QrCode size={17} /> : <CalendarDays size={17} />}</span><div className="activity-copy"><strong>{item.title}</strong><span>{item.detail}</span></div><time>{formatActivityDate(item.date)}</time>
            </li>)}</ol> : <div className="patient-empty-state activity-empty"><UsersRound size={22} /><h3>No recent activity</h3><p>Appointment and token updates will appear here when available.</p></div>}
          </section>
        </div>
      </div>
    </main>
  )
}
