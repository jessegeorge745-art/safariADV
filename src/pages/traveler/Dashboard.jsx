import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function TravelerDashboard() {
  const { token, user } = useAuth()
  const [bookings, setBookings] = useState([])
  useEffect(() => { apiRequest('/bookings', { token }).then(setBookings).catch(console.error) }, [token])
  const confirmed = bookings.filter(b => b.status === 'confirmed').length
  return (
    <div>
      <h1 className="section-title">Welcome, {user?.name?.split(' ')[0]}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ textAlign: 'center', padding: '1.4rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{confirmed}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Active Tickets</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '1.4rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{bookings.length}</div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>Total Bookings</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link to="/trip_packages" className="btn-primary">Browse TripPackages</Link>
        <Link to="/traveler/tickets" className="btn-ghost">My Tickets</Link>
      </div>
    </div>
  )
}
