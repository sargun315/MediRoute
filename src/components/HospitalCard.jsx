import { Building2, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

const text = (value, fallback = 'Not provided') => value?.toString().trim() || fallback

export default function HospitalCard({ hospital, id, name, location, departments, contact, className = '' }) {
  const record = hospital ?? { id, name, location, departments, contact }
  const hospitalId = encodeURIComponent(record.id ?? record._id ?? 'demo-hospital')
  const departmentList = Array.isArray(record.departments)
    ? record.departments.filter(Boolean)
    : typeof record.departments === 'string' && record.departments.trim()
      ? record.departments.split(',').map((item) => item.trim()).filter(Boolean)
      : []

  return (
    <article className={`data-card hospital-card ${className}`.trim()}>
      <div className="data-card-heading"><span className="data-card-icon"><Building2 size={20} aria-hidden="true" /></span><span className="demo-tag">Demo listing</span></div>
      <h2>{text(record.name, 'Hospital name unavailable')}</h2>
      <p className="card-location"><MapPin size={14} aria-hidden="true" /> {text(record.location)}</p>
      <div className="card-info-block"><h3>Departments</h3>{departmentList.length ? <ul className="tag-list">{departmentList.slice(0, 5).map((department) => <li key={department}>{department}</li>)}</ul> : <p>Not listed</p>}</div>
      <p className="demo-contact"><strong>Contact (demo):</strong> {text(record.contact, 'Demo contact not provided')}</p>
      <div className="card-actions"><Link className="button button-primary" to={`/hospitals/${hospitalId}`}>View details</Link></div>
    </article>
  )
}
