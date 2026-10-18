import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react'
import QRScanner from '../../components/QRScanner.jsx'
import Sidebar from '../../components/Sidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { validateTokenReference } from '../../services/tokenDemoService.js'

export default function ScanQR() {
  const { user } = useAuth()
  const [token, setToken] = useState(null)
  const [error, setError] = useState('')

  const lookup = (reference) => {
    setToken(null); setError('')
    const result = validateTokenReference(reference, user?.id, { allowAnyPatient: user?.role === 'admin' })
    if (!result) { setError('No matching demo token was found or this token is not available to your account.'); return }
    setToken(result)
  }

  return <main className="patient-dashboard-page token-scan-page"><div className="patient-dashboard-shell"><Sidebar role={user?.role === 'admin' ? 'admin' : 'patient'} title="Scan a token"/><section className="patient-dashboard-content" aria-labelledby="scan-token-title"><header className="patient-welcome"><div><span className="eyebrow">TOKEN LOOKUP · DEMO</span><h1 id="scan-token-title">Scan a queue token</h1><p>Use a camera or enter a token ID/reference to look up sample token data.</p></div></header><p className="token-demo-note" role="note">A QR code is only a reference. This page looks up that reference in the demo token service and does not authorize access to another patient’s details.</p><div className="token-scan-layout"><QRScanner onTokenScanned={lookup}/><section className="token-lookup-result" aria-live="polite">{error ? <><ShieldAlert size={22}/><h2>Token not verified</h2><p role="alert">{error}</p></> : token ? <><CheckCircle2 size={22}/><span className="eyebrow">DEMO TOKEN FOUND</span><h2>{token.tokenNumber}</h2><dl><div><dt>Hospital</dt><dd>{token.hospital}</dd></div><div><dt>Department</dt><dd>{token.department}</dd></div><div><dt>Status</dt><dd>{token.status}</dd></div></dl>{user?.role === 'patient' && <Link className="button button-primary" to={`/tokens/${encodeURIComponent(token.reference)}`}>View my token <ArrowRight size={15}/></Link>}</> : <><CheckCircle2 size={22}/><h2>Ready to look up</h2><p>Scan a MediRoute demo QR or enter your own token ID. The token must exist in the available demo service.</p></>}</section></div></section></div></main>
}
