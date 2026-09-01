import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/client'

const HERO_BG = 'https://images.unsplash.com/photo-1601625463687-25541fb72f62?w=1920&auto=format&fit=crop&q=80'

export default function Home() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [startAfter, setStartAfter] = useState('')
  const [travelers, setTravelers] = useState(0)

  const [stats, setStats] = useState({ tripCount: 0, destinationCount: 0 })
  const [topDestinations, setTopDestinations] = useState([])

  // Pulled from real trip data — no backend change needed for this.
  useEffect(() => {
    apiRequest('/trip_packages').then(trips => {
      const destinations = [...new Set(trips.map(t => t.destination))]
      setStats({ tripCount: trips.length, destinationCount: destinations.length })
      setTopDestinations(destinations.slice(0, 6))
    }).catch(() => {})
  }, [])

  function handleSearch(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (destination) params.set('destination', destination)
    if (startAfter) params.set('start_after', startAfter)
    navigate(`/trip_packages?${params.toString()}`)
  }

  return (
    <div
      style={{
        position: 'relative',
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* One continuous overlay over the whole page — this is what makes
          the image read as a single background instead of two separate
          photo blocks with a seam between them. */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,36,25,0.55) 0%, rgba(15,36,25,0.88) 40%, rgba(15,36,25,0.94) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero content */}
        <div style={{ minHeight: 460, display: 'flex', alignItems: 'center', paddingBottom: 60 }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem', width: '100%' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-primary)', marginBottom: 12 }}>
              Compare {stats.tripCount || ''} Trip Packages
            </p>
            <h1 style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)', fontWeight: 800, lineHeight: 1.15, marginBottom: 28, maxWidth: 600 }}>
              Your next great trip starts here
            </h1>

            {/* Search widget */}
            <form
              onSubmit={handleSearch}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.4fr 1fr auto',
                gap: 0,
                padding: 0,
                overflow: 'hidden',
                maxWidth: 780,
              }}
            >
              <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                <label style={{ marginBottom: 2 }}>Destination</label>
                <input
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Where to?"
                  style={{ border: 'none', padding: 0, background: 'transparent' }}
                />
              </div>
              <div style={{ padding: '0.7rem 1rem', borderRight: '1px solid var(--color-border)' }}>
                <label style={{ marginBottom: 2 }}>Start Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={startAfter}
                  onChange={e => setStartAfter(e.target.value)}
                  style={{ border: 'none', padding: 0, background: 'transparent' }}
                />
              </div>
              <div style={{ padding: '0.7rem 1rem' }}>
                <label style={{ marginBottom: 2 }}>Travelers</label>
                <input
                  type="number"
                  min="0"
                  value={travelers}
                  onChange={e => setTravelers(Math.max(0, Number(e.target.value)))}
                  style={{ border: 'none', padding: 0, background: 'transparent' }}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ borderRadius: 0, padding: '0 1.6rem' }}>
                Search
              </button>
            </form>

            {/* Stat row */}
            <div style={{ display: 'flex', gap: 28, marginTop: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.tripCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(242,234,216,0.7)' }}>Trip Packages</div>
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{stats.destinationCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(242,234,216,0.7)' }}>Destinations</div>
              </div>
            </div>
          </div>
        </div>

        {/* Browse by destination — now sits inside the same continuous
            background instead of breaking it up */}
        {topDestinations.length > 0 && (
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.5rem 2.5rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1.1rem' }}>Browse by Destination</h2>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {topDestinations.map(d => (
                <Link
                  key={d}
                  to={`/trip_packages?destination=${encodeURIComponent(d)}`}
                  className="btn-ghost"
                  style={{ fontSize: '0.85rem' }}
                >
                  {d}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Agent CTA */}
        <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 10 }}>Have a trip package to sell?</h2>
            <p style={{ color: 'rgba(245,237,227,0.7)', marginBottom: 24, fontSize: '1rem' }}>
              Register as an agent, list your trip, set your price, and go live — all in minutes.
            </p>
            <Link to="/agent/register" className="btn-primary">Get Started as Agent</Link>
          </div>
        </div>
      </div>
    </div>
  )
}