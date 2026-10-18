import { useState } from 'react'
import { ArrowRight, HeartPulse, Menu, X } from 'lucide-react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getDashboardPath, ROLE_LABELS } from '../utils/constants.js'

const links = [
  { label: 'Home', to: '/' },
  { label: 'Doctors', to: '/doctors' },
  { label: 'Hospitals', to: '/hospitals' },
  { label: 'Pharmacies', to: '/pharmacies' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { user, logout, storageWarning } = useAuth()
  const closeMenu = () => setMenuOpen(false)
  const handleLogout = () => {
    logout()
    closeMenu()
    navigate('/', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="MediRoute home" onClick={closeMenu}>
          <span className="brand-mark"><HeartPulse size={21} aria-hidden="true" /></span>
          <span>Medi<span className="brand-accent">Route</span></span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
        <nav id="primary-navigation" className={`main-nav${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {links.map(({ label, to }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={closeMenu}>{label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          {user ? (
            <>
              <span className="nav-user-name" title={`${user.fullName} — ${ROLE_LABELS[user.role]}`}>{user.fullName}</span>
              <Link className="button button-quiet" to={getDashboardPath(user.role)} onClick={closeMenu}>Dashboard</Link>
              <button className="button button-primary header-join" type="button" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link className="button button-quiet" to="/login" onClick={closeMenu}>Login</Link>
              <Link className="button button-primary header-join" to="/register" onClick={closeMenu}>Register <ArrowRight size={16} aria-hidden="true" /></Link>
            </>
          )}
          {storageWarning && <span className="header-storage-warning" role="status">Session not saved</span>}
        </div>
      </div>
    </header>
  )
}
