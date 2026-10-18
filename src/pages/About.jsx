import { ArrowRight, Compass, HeartHandshake, Layers3, Target, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'

const platformFeatures = [
  { title: 'Provider directories', description: 'Browse demo listings for doctors, hospitals, and pharmacies.', Icon: Layers3 },
  { title: 'Visit planning tools', description: 'Explore appointment and queue-token flows with sample information.', Icon: Compass },
  { title: 'Role-based views', description: 'Preview separate navigation paths for patients, administrators, and representatives.', Icon: UsersRound },
]

export default function About() {
  return (
    <main className="about-page">
      <section className="public-page-hero">
        <span className="eyebrow"><span className="eyebrow-dot" /> ABOUT MEDIROUTE</span>
        <h1>Helping make the next step in care easier to find.</h1>
        <p>MediRoute is a healthcare coordination platform demo that brings provider directories and visit-planning concepts into one place.</p>
        <Link className="button button-primary" to="/doctors">Explore the directories <ArrowRight size={16} /></Link>
      </section>

      <section className="page-section about-purpose" aria-label="MediRoute mission and vision">
        <article className="purpose-card"><span className="purpose-icon"><Target size={21} /></span><span className="eyebrow">OUR MISSION</span><h2>Make information easier to navigate</h2><p>We aim to give people a clear starting point for exploring provider information and organizing common visit-planning steps.</p></article>
        <article className="purpose-card"><span className="purpose-icon"><Compass size={21} /></span><span className="eyebrow">OUR VISION</span><h2>A more connected care journey</h2><p>We envision a practical digital experience that helps patients and healthcare teams coordinate the information needed for a visit.</p></article>
      </section>

      <section className="page-section about-access" aria-labelledby="access-title">
        <div className="about-access-icon"><HeartHandshake size={28} /></div>
        <div><span className="eyebrow">ACCESSIBILITY OBJECTIVES</span><h2 id="access-title">Designed to make healthcare navigation more approachable</h2><p>MediRoute’s goals include bringing directory links together, presenting information in a clear format, and supporting responsive access across common screen sizes. The demo does not verify provider availability or replace direct communication with a care provider.</p></div>
      </section>

      <section className="page-section about-features" aria-labelledby="features-title">
        <div className="section-heading"><div><span className="eyebrow">PLATFORM OVERVIEW</span><h2 id="features-title">Tools available in the demo</h2></div><p>These features illustrate product flows and may use sample information.</p></div>
        <div className="about-feature-grid">{platformFeatures.map(({ title, description, Icon }) => <article className="about-feature-card" key={title}><span className="service-icon"><Icon size={21} /></span><h3>{title}</h3><p>{description}</p></article>)}</div>
      </section>

      <section className="page-section about-journey" aria-labelledby="journey-title">
        <div><span className="eyebrow">HOW IT WORKS</span><h2 id="journey-title">From discovery to planning</h2></div>
        <ol className="journey-list"><li><span>1</span><div><strong>Explore</strong><p>Use the public directories to browse the sample provider pages.</p></div></li><li><span>2</span><div><strong>Choose a next step</strong><p>Open an appointment flow or sign in to view role-specific demo tools.</p></div></li><li><span>3</span><div><strong>Coordinate</strong><p>Preview how appointment details and queue tokens could be organized in a connected service.</p></div></li></ol>
      </section>

      <section className="page-section about-audience" aria-labelledby="audience-title">
        <div><span className="eyebrow">WHO IT SERVES</span><h2 id="audience-title">Useful perspectives for care coordination</h2></div>
        <div className="audience-grid"><article><UsersRound size={20} /><h3>Patients</h3><p>Find a starting point for provider exploration and visit planning.</p></article><article><HeartHandshake size={20} /><h3>Healthcare providers</h3><p>Preview directory and coordination concepts that could support clearer patient journeys.</p></article></div>
      </section>

      <section className="page-section about-future"><div><span className="eyebrow">WHAT’S NEXT</span><h2>Built to grow with thoughtful development</h2><p>Future work may connect secure accounts, verified provider data, appointment availability, and queue information through a backend. These services are not connected in this frontend demo.</p></div><Link className="button button-outline" to="/contact">Contact us <ArrowRight size={16} /></Link></section>
    </main>
  )
}
