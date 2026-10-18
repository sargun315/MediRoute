import { CalendarDays, MapPin, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'

const display = (value, fallback = 'Not provided') => value?.toString().trim() || fallback

export default function DoctorCard({ doctor, id, name, specialization, qualification, hospital, location, consultationFee, className = '' }) {
  const record = doctor ?? { id, name, specialization, qualification, hospital, location, consultationFee }
  const doctorId = encodeURIComponent(record.id ?? record._id ?? 'demo-doctor')
  const profilePath = `/doctors/${doctorId}`
  const bookPath = `/appointments/book?doctorId=${doctorId}`
  const fee = record.consultationFee ?? record.fee ?? '₹500'

  return (
    <article className={`data-card doctor-card ${className}`.trim()}>
      <div className="data-card-heading">
        <span className="data-card-icon"><Stethoscope size={20} aria-hidden="true" /></span>
        <span className="demo-tag">Demo listing</span>
      </div>
      <h2>{display(record.name, 'Doctor name unavailable')}</h2>
      <p className="card-specialty">{display(record.specialization, 'Specialization not listed')}</p>
      <dl className="card-details">
        <div><dt>Qualification</dt><dd>{display(record.qualification)}</dd></div>
        <div><dt>Hospital</dt><dd>{display(typeof record.hospital === 'object' ? record.hospital?.name : record.hospital)}</dd></div>
        <div><dt>Location</dt><dd><MapPin size={14} aria-hidden="true" /> {display(record.location)}</dd></div>
      </dl>
      <p className="demo-fee"><span>Consultation fee</span><strong>{display(fee)} <small>(demo)</small></strong></p>
      <div className="card-actions">
        <Link className="button button-outline" to={profilePath}>View profile</Link>
        <Link className="button button-primary" to={bookPath}><CalendarDays size={15} aria-hidden="true" /> Book appointment</Link>
      </div>
    </article>
  )
}
