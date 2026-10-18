import { Clock3, MapPin, Pill } from 'lucide-react'
import { Link } from 'react-router-dom'

const text = (value, fallback = 'Not provided') => value?.toString().trim() || fallback

export default function PharmacyCard({ pharmacy, id, name, location, contact, openingHours, className = '' }) {
  const record = pharmacy ?? { id, name, location, contact, openingHours }
  const pharmacyId = encodeURIComponent(record.id ?? record._id ?? 'demo-pharmacy')

  return (
    <article className={`data-card pharmacy-card ${className}`.trim()}>
      <div className="data-card-heading"><span className="data-card-icon"><Pill size={20} aria-hidden="true" /></span><span className="demo-tag">Demo listing</span></div>
      <h2>{text(record.name, 'Pharmacy name unavailable')}</h2>
      <p className="card-location"><MapPin size={14} aria-hidden="true" /> {text(record.location)}</p>
      <dl className="card-details compact-details">
        <div><dt>Contact</dt><dd>{text(record.contact, 'Demo contact not provided')}</dd></div>
        <div><dt><Clock3 size={14} aria-hidden="true" /> Opening hours (demo)</dt><dd>{text(record.openingHours, 'Demo hours not provided')}</dd></div>
      </dl>
      <div className="card-actions"><Link className="button button-primary" to={`/pharmacies/${pharmacyId}`}>View details</Link></div>
    </article>
  )
}
