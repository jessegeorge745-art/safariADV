import { useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { apiRequest } from '../../api/client'

export default function TravelerProfile() {
  const { user, token, updateUser } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const updated = await apiRequest('/auth/me', { method: 'PUT', token, body: form })
      updateUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h1 className="section-title">My Profile</h1>

      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'var(--color-primary)', color: 'var(--color-on-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '1.3rem', flexShrink: 0,
        }}>
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div>
          <div style={{ fontWeight: 700 }}>{user?.name}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{user?.email}</div>
          <span className="badge badge-muted" style={{ marginTop: 4 }}>{user?.role}</span>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label>Full Name</label>
          <input value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label>Email Address</label>
          <input type="email" value={form.email} onChange={set('email')} required />
        </div>
        <div>
          <label>Phone Number</label>
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+254 7XX XXX XXX" />
        </div>
        {error && <p className="msg-error">{error}</p>}
        {saved && <p className="msg-success">Profile updated successfully.</p>}
        <button type="submit" className="btn-primary" style={{ width: 'fit-content' }} disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
