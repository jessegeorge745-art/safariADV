/**
 * PublicNavbar
 *
 * Visible to everyone who is NOT logged in.
 * Per requirements:
 *   - Only "Agent Login" is shown in the navbar
 *   - Travelers do not need to sign in to browse
 *   - They are prompted to sign in only when they try to book
 */

import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import Brand from '../Brand'
import HomeIcon from '../icons/HomeIcon'

export default function PublicNavbar() {
  const [open, setOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    `text-sm font-medium hover:text-[var(--color-primary)] ${
      isActive ? 'text-[var(--color-primary)] font-semibold' : 'text-[var(--color-text-muted)]'
    }`

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 1.25rem',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo — plain text, not a link (see Brand.jsx) */}
        <Brand />

        {/* Desktop links */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '1.75rem' }}>
          <NavLink to="/" end className={linkClass} aria-label="Home"><HomeIcon /></NavLink>
          <NavLink to="/trip_packages" className={linkClass}>Trips</NavLink>
          <NavLink to="/about"  className={linkClass}>About</NavLink>
          <NavLink to="/contact" className={linkClass}>Contact</NavLink>

          {/* Only agent login in the navbar */}
          <Link to="/agent/login" className="btn-primary" style={{ padding: '0.45rem 1.1rem', fontSize: '0.85rem' }}>
            Agent Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(o => !o)}
          className="md:hidden"
          aria-label="Toggle menu"
          style={{
            background: 'none',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '0.4rem 0.6rem',
            cursor: 'pointer',
            color: 'var(--color-text)',
          }}
        >
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            padding: '1rem 1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem',
          }}
        >
          <NavLink to="/" end className={linkClass} onClick={() => setOpen(false)} aria-label="Home"><HomeIcon /></NavLink>
          <NavLink to="/trip_packages"  className={linkClass} onClick={() => setOpen(false)}>Trips</NavLink>
          <NavLink to="/about"   className={linkClass} onClick={() => setOpen(false)}>About</NavLink>
          <NavLink to="/contact" className={linkClass} onClick={() => setOpen(false)}>Contact</NavLink>
          <Link
            to="/agent/login"
            className="btn-primary"
            style={{ width: 'fit-content', fontSize: '0.85rem' }}
            onClick={() => setOpen(false)}
          >
            Agent Login
          </Link>
        </div>
      )}
    </nav>
  )
}