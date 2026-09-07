import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>404</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>
        We couldn't find that page.
      </p>
      <Link to="/" className="btn-primary">Back to Home</Link>
    </div>
  )
}
