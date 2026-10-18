import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const printable = (value, fallback = 'Not provided') => value?.toString().trim() || fallback
const cancellableStatuses = new Set(['scheduled', 'upcoming', 'confirmed', 'pending'])

export default function AppointmentCard({ appointment = {}, onCancel, className = '' }) {
  const reference = appointment.reference ?? appointment.referenceNumber ?? appointment.id ?? appointment._id
  const appointmentId = encodeURIComponent(reference ?? 'demo-appointment')
  const status = printable(appointment.status, 'Status unavailable')
  const canCancel = Boolean(reference) && typeof onCancel === 'function' && cancellableStatuses.has(status.toLowerCase())
  const provider = appointment.doctor?.name ?? appointment.doctorName ?? appointment.hospital?.name ?? appointment.hospitalName
  const date = appointment.date ?? appointment.appointmentDate
  const time = appointment.time ?? appointment.appointmentTime

  const cancel = () => {
    if (!canCancel || typeof window === 'undefined') return
    const confirmed = window.confirm(`Cancel appointment ${printable(reference, 'without a reference')}?`)
    if (confirmed) onCancel(reference ?? appointment.id ?? appointment._id)
  }

  return (
    <article className={`data-card appointment-card-item ${className}`.trim()}>
      <div className="appointment-card-top">
        <div><span className="eyebrow">APPOINTMENT</span><h2>{printable(reference, 'Reference unavailable')}</h2></div>
        <span className={`status-pill status-${status.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{status}</span>
      </div>
      <p className="appointment-provider">{printable(provider, 'Provider not listed')}</p>
      <div className="appointment-meta">
        <span><CalendarDays size={15} aria-hidden="true" /> {printable(date, 'Date not set')}</span>
        <span><Clock3 size={15} aria-hidden="true" /> {printable(time, 'Time not set')}</span>
        {appointment.consultationType && <span>{appointment.consultationType} · DEMO</span>}
        {appointment.location && <span><MapPin size={15} aria-hidden="true" /> {appointment.location}</span>}
      </div>
      <div className="card-actions">
        <Link className="button button-outline" to={`/appointments/${appointmentId}`}>View details</Link>
        {canCancel && <button className="button button-danger" type="button" onClick={cancel} aria-label={`Cancel appointment ${printable(reference)}`}>Cancel appointment</button>}
      </div>
    </article>
  )
}
