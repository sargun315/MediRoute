import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, SearchX } from 'lucide-react'
import AppointmentCard from '../../components/AppointmentCard.jsx'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { cancelAppointment, filterAppointments, listAppointments } from '../../services/appointmentDemoService.js'

const filters = [['all', 'All'], ['upcoming', 'Upcoming'], ['completed', 'Completed'], ['cancelled', 'Cancelled']]

export default function MyAppointments() {
  const { user } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [storageMessage, setStorageMessage] = useState('')

  const refresh = useCallback(() => {
    setLoading(true)
    try { setAppointments(listAppointments(user?.id)); setError('') }
    catch { setError('Appointments could not be loaded. Please try again.') }
    finally { setLoading(false) }
  }, [user?.id])
  useEffect(() => { refresh() }, [refresh])

  const filtered = useMemo(() => filterAppointments(appointments, status).filter((appointment) => {
    const provider = `${appointment.doctor?.name ?? ''} ${appointment.hospital?.name ?? ''}`
    const haystack = `${appointment.reference ?? ''} ${appointment.id ?? ''} ${provider} ${appointment.date ?? ''} ${appointment.status ?? ''}`.toLowerCase()
    return !search.trim() || haystack.includes(search.trim().toLowerCase())
  }), [appointments, status, search])

  const cancel = (reference) => {
    try {
      const result = cancelAppointment(reference, user?.id)
      setStorageMessage(result.persisted ? '' : 'The appointment was cancelled for this session, but browser storage could not save the change.')
      refresh()
    } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'This appointment could not be cancelled.') }
  }

  return <main className="patient-dashboard-page appointment-list-page"><div className="patient-dashboard-shell"><Sidebar role={user?.role ?? 'patient'} title="Appointments"/><section className="patient-dashboard-content" aria-labelledby="appointments-title"><header className="patient-welcome"><div><span className="eyebrow">YOUR VISITS · DEMO</span><h1 id="appointments-title">My appointments</h1><p>Review the demo appointments associated with your signed-in account.</p></div><Link className="button button-primary" to="/appointments/book"><CalendarDays size={16}/> Book appointment</Link></header><p className="appointment-demo-note" role="note">These records are stored in this browser for demonstration. They are not confirmed clinic bookings.</p>
    <div className="appointment-list-tools"><label htmlFor="appointment-search">Search appointments</label><input id="appointment-search" type="search" placeholder="Search ID, provider, date, or status" value={search} onChange={(event) => setSearch(event.target.value)}/></div>
    <div className="appointment-filter-tabs" role="group" aria-label="Filter appointments by status">{filters.map(([key, label]) => <button key={key} type="button" className={status === key ? 'is-active' : ''} aria-pressed={status === key} onClick={() => setStatus(key)}>{label}</button>)}</div>
    {storageMessage && <p className="appointment-feedback" role="status">{storageMessage}</p>}{error && <p className="appointment-feedback error" role="alert">{error}</p>}
    {loading ? <p className="appointment-state" role="status">Loading your demo appointments…</p> : filtered.length ? <div className="appointment-list-cards">{filtered.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} onCancel={cancel}/>)}</div> : <div className="appointment-empty"><SearchX size={25}/><h2>{appointments.length ? 'No appointments match these filters' : 'No demo appointments yet'}</h2><p>{appointments.length ? 'Try a different search or status filter.' : 'Create a sample appointment to see it listed here.'}</p>{appointments.length ? <button type="button" className="button button-outline" onClick={() => { setSearch(''); setStatus('all') }}>Clear filters</button> : <Link className="button button-primary" to="/appointments/book">Book a demo appointment</Link>}</div>}
  </section></div></main>
}
