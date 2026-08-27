import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import Brand from '../Brand'

const LINKS = [
  { to: '/trip_packages',             label: 'Browse TripPackages' },
  { to: '/traveler/dashboard', label: 'Dashboard' },
  { to: '/traveler/tickets',   label: 'My Tickets' },
  { to: '/traveler/profile',   label: 'Profile' },
]

export default function TravelerNavbar() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `text-sm hover:text-[var(--color-primary)] ${
      isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'
    }`

  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.25rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Brand homePath="/traveler/dashboard" />

        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '1.75rem' }}>
          {LINKS.map(l => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{user?.name}</span>
          <button onClick={logout} className="btn-ghost" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}>Logout</button>
        </div>

        <button onClick={() => setOpen(o => !o)} className="md:hidden" aria-label="Toggle menu"
          style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', color: 'var(--color-text)' }}>
          {open ? '✕' : '☰'}
        </button>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {LINKS.map(l => <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>)}
          <button onClick={() => { logout(); setOpen(false) }} className="btn-ghost" style={{ width: 'fit-content' }}>Logout</button>
        </div>
      )}
    </nav>
  )
}
