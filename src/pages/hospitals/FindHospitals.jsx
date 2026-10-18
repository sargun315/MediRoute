import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import HospitalCard from '../../components/HospitalCard.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { demoHospitals } from '../../services/directoryDemoData.js'

export default function FindHospitals() {
  const location = useLocation()
  const queryValue = new URLSearchParams(location.search).get('search') ?? ''
  const [records, setRecords] = useState(null); const [error, setError] = useState('')
  const [search, setSearch] = useState(queryValue); const [city, setCity] = useState(''); const [department, setDepartment] = useState(''); const [searchKey, setSearchKey] = useState(0)
  useEffect(() => { let active = true; Promise.resolve().then(() => { if (active) setRecords(demoHospitals) }).catch(() => { if (active) setError('We could not load sample hospitals. Please try again.') }); return () => { active = false } }, [])
  useEffect(() => { setSearch(queryValue); setSearchKey((key) => key + 1) }, [queryValue])
  const cities = [...new Set((records ?? []).map((item) => item.city).filter(Boolean))].sort()
  const departments = [...new Set((records ?? []).flatMap((item) => item.departments ?? []).filter(Boolean))].sort()
  const filtered = useMemo(() => (records ?? []).filter((hospital) => (!search || hospital.name.toLowerCase().includes(search.toLowerCase())) && (!city || hospital.city === city) && (!department || hospital.departments?.includes(department))), [records, search, city, department])
  const clear = () => { setSearch(''); setCity(''); setDepartment(''); setSearchKey((key) => key + 1) }
  return <main className="directory-page"><div className="directory-shell"><header className="directory-hero"><span className="eyebrow">PROVIDER DIRECTORY · SAMPLE DATA</span><h1>Find hospitals</h1><p>Browse fictional sample hospital listings by name, city, or department. Contact details and facilities are examples only.</p></header>
    <section className="directory-tools" aria-label="Hospital search and filters"><SearchBar key={searchKey} initialValue={search} label="Search hospitals by name" placeholder="Hospital name" onSearch={setSearch}/><div className="directory-filters"><label>City or location<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">All locations</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><label>Department<select value={department} onChange={(event) => setDepartment(event.target.value)}><option value="">All departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-outline" type="button" onClick={clear}>Clear filters</button></div></section>
    {records === null && !error && <p className="directory-state" role="status">Loading sample hospital listings…</p>}{error && <p className="directory-state directory-error" role="alert">{error}</p>}
    {records !== null && !error && <><p className="directory-result-count" aria-live="polite">{filtered.length} sample {filtered.length === 1 ? 'hospital' : 'hospitals'} found</p>{filtered.length ? <div className="directory-grid">{filtered.map((hospital) => <div className="directory-card-wrap" key={hospital.id}><HospitalCard hospital={hospital}/><Link className="directory-secondary-action" to={`/appointments/book?hospitalId=${encodeURIComponent(hospital.id)}`}>Book appointment</Link></div>)}</div> : <div className="directory-empty"><SearchX size={24}/><h2>No hospitals match these filters</h2><p>Try another name, city, or department.</p><button className="button button-primary" type="button" onClick={clear}>Clear filters</button></div>}</>}
    <p className="directory-demo-note">Sample listings are not verified. <Link to="/about">Learn about MediRoute</Link>.</p>
  </div></main>
}
