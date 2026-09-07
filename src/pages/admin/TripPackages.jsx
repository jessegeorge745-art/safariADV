import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function TripPackages() {
  const { token } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    apiRequest('/trip_packages', { token })
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [token])

  function moderate(id, action) {
    apiRequest(`/admin/trip_packages/${id}/${action}`, { method: 'PUT', token })
      .then(load)
      .catch(err => setError(err.message))
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="msg-error">{error}</p>

  return (
    <div>
      <h1>Trip Package Moderation</h1>
      <table>
        <thead>
          <tr><th>Title</th><th>Destination</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {trips.map(t => (
            <tr key={t.id}>
              <td>{t.title}</td>
              <td>{t.destination}</td>
              <td>{t.status}</td>
              <td>
                <button className="btn-ghost" onClick={() => moderate(t.id, 'approve')}>Approve</button>
                <button className="btn-ghost" onClick={() => moderate(t.id, 'reject')}>Reject</button>
                <button className="btn-ghost" onClick={() => moderate(t.id, 'blacklist')}>Blacklist</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}