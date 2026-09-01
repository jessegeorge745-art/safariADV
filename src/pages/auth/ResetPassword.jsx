import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/client'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await apiRequest('/auth/reset-password', { method: 'POST', body: { token, new_password: password } })
      navigate(`/${res.role}/login`, { state: { message: 'Password updated. Please log in.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="page"><p className="msg-error">Invalid or missing reset token. Please request a new reset link.</p></div>
  )

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 20 }}>Set new password</h1>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div><label>New Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} /></div>
          <div><label>Confirm Password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
          {error && <p className="msg-error">{error}</p>}
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  )
}
