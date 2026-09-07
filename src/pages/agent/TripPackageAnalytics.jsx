import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function TripPackageAnalytics() {
  const { token } = useAuth()
  const { id } = useParams()
  const [trip, setTrip] = useState(null)
  const [bookings, setBookings] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      apiRequest(`/trip_packages/${id}`, { token }),
      apiRequest(`/bookings?trip_package_id=${id}`, { token })
    ])
      .then(([t, b]) => { setTrip(t); setBookings(b) })
      .catch(err => setError(err.message))
  }, [id, token])

  if (error) return <p className="msg-error">{error}</p>
  if (!trip) return <p>Loading…</p>

  const relevant = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
  const travelersBooked = relevant.reduce((s, b) => s + (b.num_travelers || 0), 0)
  const revenue = relevant.reduce((s, b) => s + (b.payment_status === 'paid' ? trip.price * (b.num_travelers || 1) : 0), 0)

  return (
    <div>
      <h1>{trip.title} — Analytics</h1>
      <div className="stats-grid">
        <div className="card"><h3>Total Bookings</h3><p>{bookings.length}</p></div>
        <div className="card"><h3>Travelers Booked</h3><p>{travelersBooked}</p></div>
        <div className="card"><h3>Spots Remaining</h3><p>{trip.spots_remaining}</p></div>
        <div className="card"><h3>Revenue (paid)</h3><p>{revenue}</p></div>
      </div>
    </div>
  )
}