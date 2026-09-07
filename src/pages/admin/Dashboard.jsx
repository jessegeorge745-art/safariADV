import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function Dashboard() {
  const { token } = useAuth()
  const [reports, setReports] = useState(null)
  const [policy, setPolicy] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    Promise.all([
      apiRequest('/admin/reports', { token }),
      apiRequest('/admin/settings')
    ])
      .then(([reportsData, settingsData]) => {
        setReports(reportsData)
        setPolicy(settingsData.cancellation_policy || '')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  function handleSavePolicy(e) {
    e.preventDefault()
    setSaveMsg('')
    apiRequest('/admin/settings', {
      method: 'PUT',
      token,
      body: { cancellation_policy: policy }
    })
      .then(() => setSaveMsg('Saved.'))
      .catch(err => setError(err.message))
  }

  if (loading) return <p>Loading dashboard…</p>
  if (error) return <p className="msg-error">{error}</p>
  if (!reports) return null

  return (
    <div>
      <h1>Admin Dashboard</h1>

      <div className="stats-grid">
        <div className="card">
          <h3>Users</h3>
          <p>{reports.total_users ?? '—'}</p>
        </div>
        <div className="card">
          <h3>Trips (Approved)</h3>
          <p>{reports.approved_trips ?? '—'}</p>
        </div>
        <div className="card">
          <h3>Trips (Pending)</h3>
          <p>{reports.pending_trips ?? '—'}</p>
        </div>
        <div className="card">
          <h3>Revenue</h3>
          <p>{reports.total_revenue ?? '—'}</p>
        </div>
      </div>

      <div className="card">
        <h2>Top Trips</h2>
        <ul>
          {(reports.top_trips || []).map(t => (
            <li key={t.id}>{t.title} — {t.bookings_count ?? t.revenue}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Top Destinations</h2>
        <ul>
          {(reports.top_destinations || []).map((d, i) => (
            <li key={i}>{d.destination ?? d.name} — {d.count}</li>
          ))}
        </ul>
      </div>

      <div className="card">
        <h2>Cancellation Policy</h2>
        <form onSubmit={handleSavePolicy}>
          <textarea
            value={policy}
            onChange={e => setPolicy(e.target.value)}
            rows={6}
          />
          <button type="submit" className="btn-primary">Save Policy</button>
          {saveMsg && <p className="msg-success">{saveMsg}</p>}
        </form>
      </div>
    </div>
  )
}