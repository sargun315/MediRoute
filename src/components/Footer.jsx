import { useState } from 'react'
import { HeartPulse, MapPin, Mail, Phone } from 'lucide-react'
import { Link } from 'react-router-dom'

const quickLinks = [
  ['Home', '/'], ['About MediRoute', '/about'], ['Contact', '/contact'],
]
const serviceLinks = [
  ['Find doctors', '/doctors'], ['Find hospitals', '/hospitals'],
  ['Find pharmacies', '/pharmacies'], ['Book an appointment', '/appointments/book'],
]

function LinkList({ title, links }) {
  return (
    <div className="footer-column">
      <h2>{title}</h2>
      <ul>{links.map(([label, to]) => <li key={to}><Link to={to}>{label}</Link></li>)}</ul>
    </div>
  )
}

export default function Footer({ year } = {}) {
  const [copyrightYear] = useState(() => new Date().getFullYear())
  return (
    <footer className="site-footer site-footer-full">
      <div className="footer-main">
        <div className="footer-about">
          <Link className="brand footer-brand" to="/" aria-label="MediRoute home">
            <span className="brand-mark"><HeartPulse size={19} aria-hidden="true" /></span>
            <span>Medi<span className="brand-accent">Route</span></span>
          </Link>
          <p>A demo healthcare coordination platform for finding care and organizing your next steps.</p>
        </div>
        <LinkList title="Quick links" links={quickLinks} />
        <LinkList title="Healthcare services" links={serviceLinks} />
        <div className="footer-column footer-contact">
          <h2>Contact</h2>
          <p><MapPin size={15} aria-hidden="true" /> <span>Contact details are demo content.</span></p>
          <p><Phone size={15} aria-hidden="true" /> <span>No phone service is connected.</span></p>
          <p><Mail size={15} aria-hidden="true" /> <Link to="/contact">Open contact page</Link></p>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {year ?? copyrightYear} MediRoute. Demo application.</span>
        <span>For emergencies, contact your local emergency services.</span>
      </div>
    </footer>
  )
}
