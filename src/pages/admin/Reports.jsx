import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function Reports() {
  const { token } = useAuth()
  const [reports, setReports] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/admin/reports', { token })
      .then(setReports)
      .catch(err => setError(err.message))
  }, [token])

  if (error) return <p className="msg-error">{error}</p>
  if (!reports) return <p>Loading…</p>

  return (
    <div>
      <h1>Reports</h1>

      <div className="card">
        <h2>Revenue</h2>
        <p>{reports.total_revenue ?? '—'}</p>
      </div>

      <div className="card">
        <h2>Top Trips by Revenue</h2>
        <table>
          <thead><tr><th>Trip</th><th>Revenue</th></tr></thead>
          <tbody>
            {(reports.top_trips || []).map(t => (
              <tr key={t.id}><td>{t.title}</td><td>{t.revenue}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Top Destinations by Bookings</h2>
        <table>
          <thead><tr><th>Destination</th><th>Bookings</th></tr></thead>
          <tbody>
            {(reports.top_destinations || []).map((d, i) => (
              <tr key={i}><td>{d.destination ?? d.name}</td><td>{d.count}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}