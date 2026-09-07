import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function TripPackages() {
  const { token } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/trip_packages', { token })
      .then(setTrips)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  if (loading) return <p>Loading…</p>
  if (error) return <p className="msg-error">{error}</p>

  return (
    <div>
      <h1>My Trip Packages</h1>
      <Link className="btn-primary" to="/agent/trip_packages/create">Create New</Link>
      <div className="card-grid">
        {trips.map(t => (
          <div className="card" key={t.id}>
            <h3>{t.title}</h3>
            <p>{t.destination}</p>
            <span className={`badge-${t.status}`}>{t.status}</span>
            <div className="card-actions">
              <Link to={`/agent/trip_packages/${t.id}/edit`}>Edit</Link>
              <Link to={`/agent/trip_packages/${t.id}/orders`}>Orders</Link>
              <Link to={`/agent/trip_packages/${t.id}/analytics`}>Analytics</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}