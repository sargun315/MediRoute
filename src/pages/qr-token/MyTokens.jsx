import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { QrCode, SearchX } from 'lucide-react'
import QRCodeDisplay from '../../components/QRCodeDisplay.jsx'
import Sidebar from '../../components/Sidebar.jsx'
import TokenCard from '../../components/TokenCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { listPatientTokens } from '../../services/tokenDemoService.js'

export default function MyTokens() {
  const { user } = useAuth()
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    try { const records = listPatientTokens(user?.id); setTokens(records); setSelectedId((current) => records.some((item) => item.id === current) ? current : records[0]?.id ?? ''); setError('') }
    catch { setError('Your demo tokens could not be loaded.') }
    finally { setLoading(false) }
  }, [user?.id])

  const filtered = useMemo(() => tokens.filter((token) => status === 'all' || String(token.status).toLowerCase() === status), [tokens, status])
  const selected = filtered.find((token) => token.id === selectedId) ?? null

  return <main className="patient-dashboard-page token-list-page"><div className="patient-dashboard-shell"><Sidebar role="patient" title="Queue tokens"/><section className="patient-dashboard-content" aria-labelledby="my-tokens-title"><header className="patient-welcome"><div><span className="eyebrow">QUEUE TOKENS · DEMO</span><h1 id="my-tokens-title">My Tokens</h1><p>Queue references associated with your signed-in demo account.</p></div><Link className="button button-primary" to="/tokens/generate"><QrCode size={16}/> Generate token</Link></header><p className="token-demo-note" role="note">DEMO DATA: browser storage and role-based navigation are not production security controls.</p>
    <div className="token-list-toolbar"><label htmlFor="token-status-filter">Filter by status</label><select id="token-status-filter" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="waiting">Waiting</option><option value="called">Called</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div>
    {error && <p className="token-feedback error" role="alert">{error}</p>}{loading ? <p className="token-empty" role="status">Loading your demo tokens…</p> : filtered.length ? <><div className="token-list-layout"><div className="token-card-list">{filtered.map((token) => <div key={token.id}><TokenCard token={token}/><label className="token-select-row"><input type="radio" name="selected-token" value={token.id} checked={selectedId === token.id} onChange={() => setSelectedId(token.id)}/><span>Show this token’s QR code</span></label></div>)}</div>{selected && <QRCodeDisplay token={selected} title="Selected token QR code"/>}</div></> : <div className="token-empty"><SearchX size={24}/><h2>{tokens.length ? 'No tokens match this status' : 'No demo tokens yet'}</h2><p>{tokens.length ? 'Choose another status filter.' : 'Generate a token to see it here.'}</p>{tokens.length ? <button className="button button-outline" type="button" onClick={() => setStatus('all')}>Show all statuses</button> : <Link className="button button-primary" to="/tokens/generate">Generate a demo token</Link>}</div>}
  </section></div></main>
}
