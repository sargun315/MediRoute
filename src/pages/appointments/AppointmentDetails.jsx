import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, Stethoscope, XCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import { cancelAppointment, getAppointmentById, isAppointmentCancellable } from '../../services/appointmentDemoService.js'
import { isVideoConsultationEligible } from '../../services/consultationDemoService.js'

export default function AppointmentDetails() {
  const { id } = useParams(); const { user } = useAuth(); const navigate = useNavigate()
  const [appointment, setAppointment] = useState(null); const [error, setError] = useState(''); const [storageNotice, setStorageNotice] = useState(''); const [loading, setLoading] = useState(true)
  useEffect(() => { setLoading(true); try { setAppointment(getAppointmentById(id, user?.id)); setError('') } catch { setAppointment(null); setError('Appointment details could not be loaded.') } finally { setLoading(false) } }, [id, user?.id])
  const cancel = () => {
    if (!appointment || !isAppointmentCancellable(appointment)) return
    if (!window.confirm(`Cancel demo appointment ${appointment.reference ?? appointment.id}?`)) return
    try { const result = cancelAppointment(appointment.reference ?? appointment.id, user?.id); setAppointment(result.appointment); setStorageNotice(result.persisted ? '' : 'This change is available in this session only because browser storage could not save it.') }
    catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'This appointment could not be cancelled.') }
  }
  if (loading) return <main className="appointment-page"><p className="appointment-state" role="status">Loading appointment details…</p></main>
  if (!appointment) return <main className="appointment-page"><section className="appointment-not-found"><span className="appointment-error-icon"><XCircle size={25}/></span><h1>Appointment not found</h1><p>{error || 'This appointment is not available in your demo account.'}</p><Link className="button button-primary" to="/appointments"><ArrowLeft size={16}/> Return to My Appointments</Link></section></main>
  const doctor = appointment.doctor
  const hospital = appointment.hospital
  const cancellable = isAppointmentCancellable(appointment)
  return <main className="appointment-page"><article className="appointment-detail-card"><Link className="appointment-back-link" to="/appointments"><ArrowLeft size={16}/> My Appointments</Link><header className="appointment-detail-heading"><span className="appointment-detail-icon"><CalendarDays size={23}/></span><div><span className="eyebrow">DEMO APPOINTMENT</span><h1>{appointment.reference ?? appointment.id}</h1><span className={`appointment-status-badge status-${String(appointment.status).toLowerCase()}`}>{appointment.status}</span></div></header><p className="appointment-demo-note">This is a browser-stored demonstration record. It is not a real appointment confirmation.</p>
    <dl className="appointment-detail-grid"><div><dt>Doctor</dt><dd>{doctor?.name ?? 'Not selected'}</dd></div><div><dt>Specialization</dt><dd>{doctor?.specialization ?? 'Not provided'}</dd></div><div><dt>Hospital or clinic</dt><dd>{hospital?.name ?? 'Not provided'}</dd></div><div><dt>Location</dt><dd><MapPin size={14}/>{appointment.location ?? 'Not provided'}</dd></div><div><dt>Date</dt><dd><CalendarDays size={14}/>{appointment.date}</dd></div><div><dt>Time</dt><dd><Clock3 size={14}/>{appointment.time}</dd></div><div><dt>Consultation type</dt><dd>{appointment.consultationType ?? 'Not specified'}</dd></div><div><dt>Booking status</dt><dd><CheckCircle2 size={14}/>{String(appointment.status).toUpperCase()} · DEMO</dd></div></dl>
    {storageNotice && <p className="appointment-feedback" role="status">{storageNotice}</p>}{error && <p className="appointment-feedback error" role="alert">{error}</p>}<div className="appointment-actions">{isVideoConsultationEligible(appointment) && <Link className="button button-primary" to={`/consultation/${encodeURIComponent(appointment.reference ?? appointment.id)}`}>Open video consultation</Link>}{cancellable && <button className="button button-danger" type="button" onClick={cancel}>Cancel demo appointment</button>}<Link className="button button-outline" to="/appointments">Back to My Appointments</Link>{doctor?.id && <Link className="appointment-text-link" to={`/doctors/${doctor.id}`}>View sample doctor</Link>}</div>
  </article></main>
}
