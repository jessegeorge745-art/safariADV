import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function TravelerRegister() {
  const { registerTraveler, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const prefill = location.state || {}
  const [name, setName]       = useState(prefill.prefillName  || '')
  const [email, setEmail]     = useState(prefill.prefillEmail || '')
  const [phone, setPhone]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await registerTraveler({ name, email, phone, password })
      // Auto-login after registration
      await login('traveler', { email, password })
      // Check if they had a booking intent
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
      <div style={{ width: '100%', maxWidth: 420 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Create your account</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 24 }}>
          Already have an account? <Link to="/traveler/login" style={{ color: 'var(--color-primary)' }}>Log in</Link>
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>Full Name</label><input value={name} onChange={e => setName(e.target.value)} required placeholder="Jane Doe" /></div>
          <div><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com" /></div>
          <div><label>Phone Number</label><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" /></div>
          <div><label>Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 8 characters" minLength={8} /></div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Creating...' : 'Create Account'}</button>
        </form>
      </div>
    </div>
  )
}
