import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Building2, CalendarDays, MapPin, QrCode } from 'lucide-react'
import QRCodeDisplay from '../../components/QRCodeDisplay.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getTokenById } from '../../services/tokenDemoService.js'

function formatCreated(value) {
  if (!value) return 'Time not provided'
  const date = new Date(value.length === 10 ? `${value}T12:00:00` : value)
  return Number.isNaN(date.getTime()) ? 'Time not provided' : new Intl.DateTimeFormat(undefined, { dateStyle: 'full', timeStyle: 'short' }).format(date)
}

export default function TokenDetails() {
  const { id } = useParams(); const { user } = useAuth()
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    setToken(getTokenById(id, user?.id))
    setLoading(false)
  }, [id, user?.id])
  if (loading) return <main className="token-page"><p className="token-empty-state" role="status">Loading token details…</p></main>
  if (!token) return <main className="token-page"><section className="token-not-found"><span className="token-error-icon"><QrCode size={23}/></span><h1>Token not found</h1><p>This token is not available for your demo account, or the link may be incorrect.</p><Link className="button button-primary" to="/tokens"><ArrowLeft size={16}/> Back to My Tokens</Link></section></main>
  return <main className="token-page"><div className="token-detail-layout"><article className="token-detail-card"><Link className="token-back-link" to="/tokens"><ArrowLeft size={16}/> My Tokens</Link><header className="token-detail-heading"><span className="token-detail-icon"><QrCode size={23}/></span><div><span className="eyebrow">DEMO QUEUE TOKEN</span><h1>{token.tokenNumber}</h1><span className={`status-pill status-${String(token.status).toLowerCase()}`}>{token.status}</span></div></header><p className="token-demo-note">This is a sample queue reference only. It does not reserve a real place in a hospital queue.</p><dl className="token-detail-fields"><div><dt>Token ID</dt><dd>{token.id}</dd></div><div><dt>Token reference</dt><dd>{token.reference}</dd></div><div><dt><Building2 size={14}/> Hospital or clinic</dt><dd>{token.hospital || 'Not provided'}</dd></div><div><dt>Department</dt><dd>{token.department || 'Not provided'}</dd></div><div><dt><MapPin size={14}/> Estimated position (demo)</dt><dd>{token.estimatedPosition ?? 'Not available'}</dd></div><div><dt><CalendarDays size={14}/> Created</dt><dd>{formatCreated(token.createdAt)}</dd></div></dl></article><QRCodeDisplay token={token} title="Queue token QR code"/></div></main>
}
