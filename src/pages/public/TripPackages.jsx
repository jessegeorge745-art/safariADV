import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'

const HERO_BG = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1920&auto=format&fit=crop&q=80'

export default function TripPackages() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tripPackages, setTripPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Pre-fill from the Home page's search widget (?destination=, ?start_after=)
  const [search, setSearch] = useState(searchParams.get('destination') || '')

  useEffect(() => {
    setLoading(true)
    const params = {}
    if (searchParams.get('destination')) params.destination = searchParams.get('destination')
    if (searchParams.get('start_after')) params.start_after = searchParams.get('start_after')

    const query = new URLSearchParams(params).toString()
    apiRequest(`/trip_packages${query ? `?${query}` : ''}`)
      .then(setTripPackages)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [searchParams])

  function handleSearchChange(value) {
    setSearch(value)
    setSearchParams(value ? { destination: value } : {})
  }

  const filtered = tripPackages.filter(t =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.destination?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div
      style={{
        position: 'relative',
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* One continuous overlay for the whole page — same approach as
          Home.jsx, so the background reads as one image all the way
          down to the footer instead of a small capped hero band. */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,36,25,0.55) 0%, rgba(15,36,25,0.85) 25%, rgba(15,36,25,0.94) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero content */}
        <div style={{ padding: '3rem 1.5rem 1.5rem' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 6 }}>
              {loading ? 'Trips' : `${filtered.length} Trip Package${filtered.length !== 1 ? 's' : ''}`}
            </h1>
            <p style={{ color: 'rgba(245,237,227,0.75)', fontSize: '0.9rem' }}>Find your next trip, wherever it takes you.</p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1rem 1.5rem 3rem' }}>
          {/* Search */}
          <input
            placeholder="Search by trip name or destination..."
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            style={{ maxWidth: 420, marginBottom: '1.75rem' }}
          />

          {loading && <p style={{ color: 'var(--color-text-muted)' }}>Loading trips...</p>}
          {error   && <p className="msg-error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>No trips found. Try a different search.</p>
          )}

          {/* Info-dense list layout (rather than a plain image-grid) —
              closer to SafariBookings' listing style: image + badges +
              "you'll visit" line + price + availability, all on one row. */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(tripPackage => (
              <Link
                key={tripPackage.id}
                to={`/trip_packages/${tripPackage.id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: '240px 1fr' }}>
                  {/* Trip image */}
                  <div style={{
                    minHeight: 160,
                    backgroundImage: tripPackage.image_url ? `url(${tripPackage.image_url})` : 'none',
                    backgroundColor: tripPackage.image_url ? 'transparent' : 'var(--color-surface-alt)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {!tripPackage.image_url && <span style={{ fontSize: '2.5rem' }}>🧳</span>}
                  </div>

                  <div style={{ padding: '1.1rem 1.3rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      {/* Category badge row — mirrors SafariBookings' trip-type tags */}
                      {tripPackage.categories?.length > 0 && (
                        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                          {tripPackage.categories.map(c => (
                            <span key={c.id} className="badge badge-gold">{c.name}</span>
                          ))}
                        </div>
                      )}
                      <h3 style={{ fontWeight: 700, marginBottom: 6, fontSize: '1.05rem' }}>{tripPackage.title}</h3>

                      {/* "You'll visit" line — mirrors SafariBookings' itinerary-stop summary */}
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                        <strong style={{ color: 'var(--color-text)' }}>You'll visit:</strong> {tripPackage.destination}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        📅 {new Date(tripPackage.start_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' – '}
                        {new Date(tripPackage.end_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
                      <span className={`badge ${tripPackage.spots_remaining > 0 ? 'badge-green' : 'badge-red'}`}>
                        {tripPackage.spots_remaining > 0 ? `${tripPackage.spots_remaining} spots left` : 'Fully booked'}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>from</div>
                        <div style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 800 }}>
                          KES {tripPackage.price} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--color-text-muted)' }}>pp</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}