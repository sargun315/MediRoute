import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import PharmacyCard from '../../components/PharmacyCard.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { demoPharmacies } from '../../services/directoryDemoData.js'

export default function FindPharmacies() {
  const location = useLocation(); const queryValue = new URLSearchParams(location.search).get('search') ?? ''
  const [records, setRecords] = useState(null); const [error, setError] = useState(''); const [search, setSearch] = useState(queryValue); const [city, setCity] = useState(''); const [searchKey, setSearchKey] = useState(0)
  useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) setRecords(demoPharmacies) }).catch(() => { if (active) setError('We could not load sample pharmacies. Please try again.') }); return () => { active = false } }, [])
  useEffect(() => { setSearch(queryValue); setSearchKey((key) => key + 1) }, [queryValue])
  const cities = [...new Set((records ?? []).map((item) => item.city).filter(Boolean))].sort()
  const filtered = useMemo(() => (records ?? []).filter((pharmacy) => (!search || `${pharmacy.name} ${pharmacy.location}`.toLowerCase().includes(search.toLowerCase())) && (!city || pharmacy.city === city)), [records, search, city])
  const clear = () => { setSearch(''); setCity(''); setSearchKey((key) => key + 1) }
  return <main className="directory-page"><div className="directory-shell"><header className="directory-hero"><span className="eyebrow">PROVIDER DIRECTORY · SAMPLE DATA</span><h1>Find pharmacies</h1><p>Browse fictional sample pharmacy listings by name or location. Contact and hours are examples only; medicine availability is not provided.</p></header>
    <section className="directory-tools" aria-label="Pharmacy search and filters"><SearchBar key={searchKey} initialValue={search} label="Search pharmacies by name or location" placeholder="Pharmacy name or location" onSearch={setSearch}/><div className="directory-filters"><label>City or location<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">All locations</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-outline" type="button" onClick={clear}>Clear filters</button></div></section>
    {records === null && !error && <p className="directory-state" role="status">Loading sample pharmacy listings…</p>}{error && <p className="directory-state directory-error" role="alert">{error}</p>}
    {records !== null && !error && <><p className="directory-result-count" aria-live="polite">{filtered.length} sample {filtered.length === 1 ? 'pharmacy' : 'pharmacies'} found</p>{filtered.length ? <div className="directory-grid">{filtered.map((pharmacy) => <PharmacyCard key={pharmacy.id} pharmacy={pharmacy}/>)}</div> : <div className="directory-empty"><SearchX size={24}/><h2>No pharmacies match these filters</h2><p>Try another name or location.</p><button className="button button-primary" type="button" onClick={clear}>Clear filters</button></div>}</>}
    <p className="directory-demo-note">Sample listings do not indicate stock, dispensing services, or verified operating hours. <Link to="/about">Learn about MediRoute</Link>.</p>
  </div></main>
}
