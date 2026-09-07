import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

const NEXT_STATUSES = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled']
}

export default function TripPackageOrders() {
  const { token } = useAuth()
  const { id } = useParams()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    apiRequest(`/bookings?trip_package_id=${id}`, { token })
      .then(setBookings)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id, token])

  function updateStatus(bookingId, status) {
    apiRequest(`/bookings/${bookingId}`, { method: 'PUT', token, body: { status } })
      .then(load)
      .catch(err => setError(err.message))
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="msg-error">{error}</p>

  return (
    <div>
      <h1>Orders</h1>
      <table>
        <thead>
          <tr>
            <th>Booking</th><th>Traveler</th><th>Travelers</th>
            <th>Status</th><th>Payment</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map(b => (
            <tr key={b.id}>
              <td>#{b.id}</td>
              <td>{b.guest_name || b.user?.name || '—'}</td>
              <td>{b.num_travelers}</td>
              <td>{b.status}</td>
              <td>{b.payment_status}</td>
              <td>
                {(NEXT_STATUSES[b.status] || []).map(next => (
                  <button
                    key={next}
                    className="btn-ghost"
                    onClick={() => updateStatus(b.id, next)}
                  >
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