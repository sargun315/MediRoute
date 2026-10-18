import { Building2, CalendarDays, Clock3, QrCode } from 'lucide-react'
import { Link } from 'react-router-dom'

const value = (input, fallback = 'Not provided') => input?.toString().trim() || fallback
const formatCreated = (input) => {
  if (!input) return 'Time not provided'
  const date = new Date(input.length === 10 ? `${input}T12:00:00` : input)
  return Number.isNaN(date.getTime()) ? 'Time not provided' : new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

export default function TokenCard({ token, id, tokenNumber, hospital, department, status, className = '' }) {
  const record = token ?? { id, tokenNumber, hospital, department, status }
  const reference = record.reference ?? record.id ?? record._id ?? 'demo-token'
  const statusText = value(record.status, 'Status unavailable')

  return (
    <article className={`data-card token-card ${className}`.trim()}>
      <div className="data-card-heading"><span className="data-card-icon"><QrCode size={20} aria-hidden="true" /></span><span className={`status-pill status-${statusText.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{statusText}</span></div>
      <span className="eyebrow">QUEUE TOKEN</span>
      <h2>{value(record.tokenNumber ?? record.number, 'Token number unavailable')}</h2>
      <dl className="card-details">
        <div><dt><Building2 size={14} aria-hidden="true" /> Hospital or clinic</dt><dd>{value(typeof record.hospital === 'object' ? record.hospital?.name : record.hospital)}</dd></div>
        <div><dt>Department</dt><dd>{value(record.department)}</dd></div>
        {record.estimatedWait && <div><dt><Clock3 size={14} aria-hidden="true" /> Estimated wait</dt><dd>{record.estimatedWait}</dd></div>}
        {record.estimatedPosition && <div><dt>Estimated position (demo)</dt><dd>{record.estimatedPosition}</dd></div>}
        {record.createdAt && <div><dt><CalendarDays size={14} aria-hidden="true" /> Created (demo)</dt><dd>{formatCreated(record.createdAt)}</dd></div>}
      </dl>
      <div className="card-actions"><Link className="button button-outline" to={`/tokens/${encodeURIComponent(reference)}`}>View token details</Link></div>
    </article>
  )
}
