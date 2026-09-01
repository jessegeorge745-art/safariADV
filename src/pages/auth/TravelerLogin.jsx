import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function TravelerLogin() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login('traveler', { email, password })
      const intent = sessionStorage.getItem('booking_intent')
      if (intent) {
        const { trip_package_id } = JSON.parse(intent)
        sessionStorage.removeItem('booking_intent')
        navigate(`/trip_packages/${trip_package_id}`)
      } else {
        navigate('/traveler/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Welcome back</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
          Don't have an account? <Link to="/traveler/register" style={{ color: 'var(--color-primary)' }}>Sign up</Link>
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
          <div><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textDecoration: 'none', marginTop: -4 }}>Forgot password?</Link>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Logging in...' : 'Log In'}</button>
        </form>
      </div>
    </div>
  )
}
