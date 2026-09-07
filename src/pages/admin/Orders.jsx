import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled']
}

export default function Orders() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    apiRequest('/bookings', { token })
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [token])

  function updateStatus(id, status) {
    apiRequest(`/bookings/${id}`, { method: 'PUT', token, body: { status } })
      .then(load)
      .catch(err => setError(err.message))
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="msg-error">{error}</p>

  const revenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + (b.total_price || 0), 0)

  return (
    <div>
      <h1>All Orders</h1>
      <p>Revenue (confirmed/completed): {revenue}</p>
      <table>
        <thead>
          <tr><th>Booking</th><th>Trip</th><th>Traveler</th><th>Status</th><th>Payment</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>#{b.id}</td>
              <td>{b.trip_package?.title || b.trip_package_id}</td>
              <td>{b.guest_name || b.user?.name || '—'}</td>
              <td>{b.status}</td>
              <td>{b.payment_status}</td>
              <td>
                {(NEXT_STATUSES[b.status] || []).map(next => (
                  <button key={next} className="btn-ghost" onClick={() => updateStatus(b.id, next)}>
                    {next}
                  </button>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}