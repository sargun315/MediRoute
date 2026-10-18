import { useState } from 'react'
import { Activity, CalendarDays, ClipboardList, FileClock, HeartPulse, LayoutDashboard, Menu, QrCode, Stethoscope, Users, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const navigation = {
  patient: {
    heading: 'Patient',
    links: [
      ['Dashboard', '/patient/dashboard', LayoutDashboard],
      ['My profile', '/patient/profile', Users],
      ['Appointments', '/appointments', CalendarDays],
      ['Generate queue token', '/tokens/generate', QrCode],
      ['Queue tokens', '/tokens', QrCode],
      ['Scan token QR', '/tokens/scan', QrCode],
      ['Consultations', '/consultation/history', Activity],
    ],
  },
  admin: {
    heading: 'Admin',
    links: [
      ['Dashboard', '/admin', LayoutDashboard],
      ['Manage users', '/admin/users', Users],
      ['Manage doctors', '/admin/doctors', Stethoscope],
      ['Manage hospitals', '/admin/hospitals', HeartPulse],
      ['Hospital queue', '/queue', ClipboardList],
      ['Manage tokens', '/admin/tokens', QrCode],
    ],
  },
  representative: {
    heading: 'Medical representative',
    links: [
      ['Dashboard', '/mr/dashboard', LayoutDashboard],
      ['Doctor directory', '/mr/doctors', Stethoscope],
      ['Visit history', '/mr/visits', FileClock],
      ['Hospital queue', '/queue', ClipboardList],
      ['Appointments', '/appointments', ClipboardList],
    ],
  },
}

/** role accepts patient, admin, representative, or all. */
export default function Sidebar({ role = 'patient', title = 'Dashboard', onNavigate }) {
  const [open, setOpen] = useState(false)
  const groups = role === 'all' ? Object.entries(navigation) : [[role, navigation[role]]].filter(([, group]) => group)
  const navigate = () => {
    setOpen(false)
    onNavigate?.()
  }

  return (
    <aside className={`dashboard-sidebar${open ? ' is-open' : ''}`}>
      <div className="sidebar-heading">
        <span>{title}</span>
        <button className="sidebar-toggle" type="button" aria-label={open ? 'Close dashboard navigation' : 'Open dashboard navigation'} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
      <nav aria-label="Dashboard navigation" className="sidebar-nav">
        {groups.map(([key, group]) => (
          <section className="sidebar-group" key={key} aria-labelledby={`sidebar-${key}`}>
            <h2 id={`sidebar-${key}`}>{group.heading}</h2>
            {group.links.map(([label, to, Icon]) => (
              <NavLink key={to} to={to} end={to === '/admin' || to === '/patient/dashboard' || to === '/mr/dashboard'} onClick={navigate}>
                <Icon size={17} aria-hidden="true" /><span>{label}</span>
              </NavLink>
            ))}
          </section>
        ))}
        {groups.length === 0 && <p className="sidebar-empty">Choose patient, admin, representative, or all for navigation links.</p>}
      </nav>
    </aside>
  )
}
