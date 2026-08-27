
import { Link } from 'react-router-dom'

function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

export default function Brand({ homePath = '/', badge }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <Link
        to={homePath}
        aria-label="Home"
        style={{
          display: 'inline-flex',
          color: 'var(--color-primary)',
          textDecoration: 'none',
        }}
      >
        <HomeIcon />
      </Link>
      <span
        style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: 'var(--color-text)',
          letterSpacing: '-0.01em',
        }}
      >
        SafariADV
      </span>
      {badge && (
        <span style={{ marginLeft: 2, fontSize: '0.7rem', background: 'rgba(232,160,32,0.15)', color: 'var(--color-primary)', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>
          {badge}
        </span>
      )}
    </div>
  )
}
