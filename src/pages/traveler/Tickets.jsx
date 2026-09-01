import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

const STATUS_BADGE = { pending: 'badge-gold', confirmed: 'badge-green', completed: 'badge-muted', cancelled: 'badge-red' }
const TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
  { value: 'all', label: 'All' },
]

export default function TravelerTickets() {
  const { token } = useAuth()
  const [bookings, setBookings] = useState([])
  const [tripPackages, setTripPackages] = useState({}) // id -> trip package
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    let cancelled = false

    apiRequest('/bookings', { token })
      .then(async data => {
        if (cancelled) return
        setBookings(data)

        // The booking list doesn't include trip details, so fetch each
        // distinct trip package once and key it by id for display.
        const uniqueIds = [...new Set(data.map(b => b.trip_package_id))]
        const entries = await Promise.all(
          uniqueIds.map(id =>
            apiRequest(`/trip_packages/${id}`, { token })
              .then(t => [id, t])
              .catch(() => [id, null])
          )
        )
        if (!cancelled) setTripPackages(Object.fromEntries(entries))
      })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [token])

  async function handleCancel(id) {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return
    await apiRequest(`/bookings/${id}`, { method: 'PUT', token, body: { status: 'cancelled' } })
    setBookings(b => b.map(x => x.id === id ? { ...x, status: 'cancelled' } : x))
  }

  if (loading) return <p style={{ color: 'var(--color-text-muted)' }}>Loading your bookings...</p>

  const now = new Date()
  const isPast = b => {
    const trip = tripPackages[b.trip_package_id]
    return trip ? new Date(trip.end_date) < now : false
  }

  const filtered = bookings.filter(b => {
    if (tab === 'all') return true
    if (tab === 'upcoming') return !isPast(b)
    return isPast(b)
  })

  return (
    <div>
      <h1 className="section-title">My Bookings</h1>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {TABS.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={t.value === tab ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.35rem 1rem', fontSize: '0.85rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
            {tab === 'upcoming' ? "You have no upcoming trips." : tab === 'past' ? "No past trips yet." : "You have no bookings yet."}
          </p>
          <Link to="/trip_packages" className="btn-primary">Browse Trips</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(b => {
            const trip = tripPackages[b.trip_package_id]
            return (
              <div key={b.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>
                    {trip?.title || `Booking #${b.id}`}
                  </div>
                  {trip?.destination && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                      📍 {trip.destination}
                    </div>
                  )}
                  <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                    {b.num_travelers} traveler(s) &nbsp;·&nbsp; KES {Number(b.total_amount).toFixed(2)}
                    &nbsp;·&nbsp; Booked {new Date(b.created_at).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${STATUS_BADGE[b.status] || 'badge-muted'}`}>
                    {b.status}
                  </span>
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      className="btn-ghost"
                      style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
