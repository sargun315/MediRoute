import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, Clock3, HeartPulse, MapPin, Pill, QrCode, Search, ShieldCheck, Stethoscope, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar.jsx'

const serviceCards = [
  { title: 'Find doctors', description: 'Explore the doctor directory by specialty or location.', to: '/doctors', Icon: Stethoscope },
  { title: 'Find hospitals', description: 'Browse hospital profiles and department information.', to: '/hospitals', Icon: HeartPulse },
  { title: 'Find pharmacies', description: 'Explore pharmacy listings and contact details.', to: '/pharmacies', Icon: Pill },
  { title: 'Book an appointment', description: 'Start a demo appointment request with a provider.', to: '/appointments/book', Icon: CalendarDays },
]

const steps = [
  { number: '01', title: 'Explore care options', description: 'Browse provider directories and review the information available in the demo.', Icon: Search },
  { number: '02', title: 'Plan your next step', description: 'Open an appointment page or sign in to explore your role dashboard.', Icon: CalendarDays },
  { number: '03', title: 'Keep details together', description: 'Use the demo token tools to see how a visit queue could be organized.', Icon: QrCode },
]

export default function Home() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('doctors')
  const search = (query) => {
    const params = new URLSearchParams()
    if (query) params.set('search', query)
    navigate(`/${category}${params.size ? `?${params}` : ''}`)
  }

  return (
    <main className="home-page">
      <section className="hero-section home-hero">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> A CLEARER WAY TO FIND CARE</span>
          <h1>Your Healthcare,<br /><span>One Route Away</span></h1>
          <p className="hero-description">Explore doctors, hospitals, and pharmacies, then use MediRoute’s demo tools to plan your next step.</p>
          <div className="home-search">
            <label htmlFor="provider-category">Search in</label>
            <select id="provider-category" value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="doctors">Doctors</option>
              <option value="hospitals">Hospitals</option>
              <option value="pharmacies">Pharmacies</option>
            </select>
            <SearchBar label={`Search ${category}`} placeholder="Name, specialty, or location" onSearch={search} />
          </div>
          <div className="hero-actions home-actions">
            <Link className="button button-primary button-large" to="/doctors"><Stethoscope size={17} /> Find Doctors</Link>
            <Link className="button button-outline button-large" to="/hospitals"><HeartPulse size={17} /> Find Hospitals</Link>
            <Link className="button button-outline button-large" to="/pharmacies"><Pill size={17} /> Find Pharmacies</Link>
            <Link className="button button-outline button-large" to="/appointments/book"><CalendarDays size={17} /> Book Appointment</Link>
          </div>
          <div className="hero-note"><span className="note-icon"><ShieldCheck size={16} /></span>Information and tools on this site are demo content.</div>
        </div>
        <div className="hero-visual home-visual" aria-label="Illustration of connected healthcare services">
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
          <div className="visual-center"><HeartPulse size={62} strokeWidth={1.6} aria-hidden="true" /></div>
          <div className="floating-card location-card"><span className="float-icon teal"><MapPin size={18} aria-hidden="true" /></span><span><strong>Explore nearby care</strong><small>Provider directory demo</small></span></div>
          <div className="floating-card appointment-card"><span className="float-icon blue"><Clock3 size={18} aria-hidden="true" /></span><span><strong>Plan a visit</strong><small>Appointment tools</small></span></div>
          <span className="visual-spark spark-one" /><span className="visual-spark spark-two" />
        </div>
      </section>

      <section className="service-section page-section" aria-labelledby="services-title">
        <div className="section-heading"><div><span className="eyebrow">MEDIROUTE SERVICES</span><h2 id="services-title">Where would you like to start?</h2></div><p>Choose a directory or open a demo tool to explore the platform.</p></div>
        <div className="service-grid">
          {serviceCards.map(({ title, description, to, Icon }) => <Link className="service-card" to={to} key={title}>
            <span className="service-icon"><Icon size={21} aria-hidden="true" /></span><ChevronRight className="service-arrow" size={19} aria-hidden="true" />
            <h3>{title}</h3><p>{description}</p>
          </Link>)}
        </div>
      </section>

      <section className="how-section page-section" aria-labelledby="how-title">
        <div className="section-heading"><div><span className="eyebrow">THREE SIMPLE STEPS</span><h2 id="how-title">How MediRoute works</h2></div><p>The current experience is a frontend demo of a connected care journey.</p></div>
        <div className="steps-grid">{steps.map(({ number, title, description, Icon }) => <article className="step-card" key={number}>
          <span className="step-icon"><Icon size={20} aria-hidden="true" /></span><span className="step-number">{number}</span><h3>{title}</h3><p>{description}</p>
        </article>)}</div>
      </section>

      <section className="benefits-section page-section" aria-labelledby="benefits-title">
        <div className="benefits-copy"><span className="eyebrow">DESIGNED FOR THE JOURNEY</span><h2 id="benefits-title">Useful tools, in one place</h2><p>MediRoute brings directory browsing and visit-planning concepts together in a single demo experience.</p>
          <ul className="benefit-list"><li><CheckCircle2 size={18} /> Browse provider information from one starting point</li><li><CheckCircle2 size={18} /> Find clear paths to appointment and queue tools</li><li><CheckCircle2 size={18} /> Preview role-based navigation for demo accounts</li></ul>
          <Link className="button button-outline" to="/about">Learn about MediRoute <ArrowRight size={16} /></Link>
        </div>
        <div className="sample-stats" aria-label="Sample platform statistics"><span className="demo-tag">SAMPLE DATA</span><h3>Demo platform snapshot</h3><p>Illustrative figures only; these do not describe live providers or patients.</p>
          <div className="stats-grid"><div><Stethoscope size={18} /><strong>120+</strong><span>sample doctors</span></div><div><HeartPulse size={18} /><strong>35+</strong><span>sample hospitals</span></div><div><UsersRound size={18} /><strong>80+</strong><span>demo accounts</span></div><div><MapPin size={18} /><strong>12</strong><span>sample locations</span></div></div>
        </div>
      </section>

      <section className="token-banner home-token-banner"><div className="token-banner-icon"><QrCode size={25} aria-hidden="true" /></div><div><h2>Explore queue tokens</h2><p>Sign in to try the demo token flow. Token information is not a live hospital queue.</p></div><Link className="button button-light" to="/tokens/generate">Generate Queue Token <ArrowRight size={16} /></Link></section>
    </main>
  )
}
