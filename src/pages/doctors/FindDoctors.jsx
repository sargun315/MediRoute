import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowUpDown, SearchX } from 'lucide-react'
import DoctorCard from '../../components/DoctorCard.jsx'
import SearchBar from '../../components/SearchBar.jsx'
import { demoDoctors } from '../../services/directoryDemoData.js'

export default function FindDoctors() {
  const location = useLocation()
  const queryValue = new URLSearchParams(location.search).get('search') ?? ''
  const [records, setRecords] = useState(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState(queryValue)
  const [specialty, setSpecialty] = useState('')
  const [city, setCity] = useState('')
  const [sort, setSort] = useState('name')
  const [searchKey, setSearchKey] = useState(0)

  useEffect(() => {
    let active = true
    Promise.resolve().then(() => { if (active) setRecords(demoDoctors) }).catch(() => { if (active) setError('We could not load sample doctors. Please try again.') })
    return () => { active = false }
  }, [])
  useEffect(() => { setSearch(queryValue); setSearchKey((key) => key + 1) }, [queryValue])

  const specializations = [...new Set((records ?? []).map((item) => item.specialization).filter(Boolean))].sort()
  const cities = [...new Set((records ?? []).map((item) => item.city).filter(Boolean))].sort()
  const filtered = useMemo(() => (records ?? []).filter((doctor) => {
    const text = `${doctor.name} ${doctor.specialization}`.toLowerCase()
    return (!search || text.includes(search.toLowerCase())) && (!specialty || doctor.specialization === specialty) && (!city || doctor.city === city)
  }).sort((a, b) => sort === 'fee' ? Number(a.consultationFee.match(/\d+/)?.[0] ?? Infinity) - Number(b.consultationFee.match(/\d+/)?.[0] ?? Infinity) : a.name.localeCompare(b.name)), [records, search, specialty, city, sort])

  const clear = () => { setSearch(''); setSpecialty(''); setCity(''); setSort('name'); setSearchKey((key) => key + 1) }
  return <main className="directory-page"><div className="directory-shell">
    <header className="directory-hero"><span className="eyebrow">PROVIDER DIRECTORY · SAMPLE DATA</span><h1>Find doctors</h1><p>Explore fictional sample listings and narrow results by specialty or city. Confirm provider details directly before making plans.</p></header>
    <section className="directory-tools" aria-label="Doctor search and filters">
      <SearchBar key={searchKey} initialValue={search} label="Search doctors by name or specialization" placeholder="Doctor name or specialization" onSearch={setSearch} />
      <div className="directory-filters">
        <label>Specialization<select value={specialty} onChange={(event) => setSpecialty(event.target.value)}><option value="">All specializations</option>{specializations.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>City or location<select value={city} onChange={(event) => setCity(event.target.value)}><option value="">All locations</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="filter-label-icon"><ArrowUpDown size={14} aria-hidden="true" /> Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="name">Name</option><option value="fee">Consultation fee</option></select></label>
        <button className="button button-outline" type="button" onClick={clear}>Clear filters</button>
      </div>
    </section>
    {records === null && !error && <p className="directory-state" role="status">Loading sample doctor listings…</p>}
    {error && <p className="directory-state directory-error" role="alert">{error}</p>}
    {records !== null && !error && <><p className="directory-result-count" aria-live="polite">{filtered.length} sample {filtered.length === 1 ? 'doctor' : 'doctors'} found</p>{filtered.length ? <div className="directory-grid">{filtered.map((doctor) => <DoctorCard key={doctor.id} doctor={doctor} />)}</div> : <div className="directory-empty"><SearchX size={24} aria-hidden="true"/><h2>No doctors match these filters</h2><p>Try another name, specialization, or location.</p><button type="button" className="button button-primary" onClick={clear}>Clear filters</button></div>}</>}
    <p className="directory-demo-note">These are fictional interface examples, not verified healthcare listings. <Link to="/about">Learn about MediRoute</Link>.</p>
  </div></main>
}
