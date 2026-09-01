/**
 * TripPackageDetails
 *
 * Anyone can view a trip package's details and book it without being
 * logged in — booking never requires an account.
 *
 * When the user clicks "Book This Trip":
 *   - If they are logged in as a traveler → name/email/phone are already on
 *     file, so they only pick a number of travelers and payment method.
 *   - If not logged in → they enter full name, email and phone purely so the
 *     itinerary/receipt can be sent to them (NOT for signing in).
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'
import WeatherWidget from '../../components/WeatherWidget'

const PAYMENT_METHODS = [
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash on arrival' },
]

export default function TripPackageDetails() {
  const { id } = useParams()
  const { token, role, isAuthenticated } = useAuth()

  const [tripPackage, setTripPackage] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancellationPolicy, setCancellationPolicy] = useState('')

  const [showBookingForm, setShowBookingForm] = useState(false)
  const [numTravelers, setNumTravelers] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('mpesa')
  const [bookingMsg, setBookingMsg] = useState('')
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Buyer info — only needed to deliver the itinerary/receipt when the
  // buyer isn't logged in. Never used for authentication.
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  const isTravelerSession = isAuthenticated && role === 'traveler'

  useEffect(() => {
    apiRequest(`/trip_packages/${id}`, { token })
      .then(setTripPackage)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    // No auth needed — settings are public so this is safe to fetch
    // regardless of login state. If it fails, just skip showing it.
    apiRequest('/admin/settings')
      .then(s => setCancellationPolicy(s.cancellation_policy || ''))
      .catch(() => {})
  }, [id, token])

  const totalPrice = tripPackage ? (tripPackage.price * numTravelers).toFixed(2) : null

  async function handleBooking(e) {
    e.preventDefault()
    if (!isTravelerSession && (!guestName || !guestEmail || !guestPhone)) {
      setBookingMsg('Please fill in your name, email and phone so we can send your itinerary.')
      return
    }

    setSubmitting(true)
    setBookingMsg('')
    try {
      await apiRequest('/bookings', {
        method: 'POST',
        token: isTravelerSession ? token : null,
        body: {
          trip_package_id: tripPackage.id,
          num_travelers: Number(numTravelers),
          payment_method: paymentMethod,
          ...(isTravelerSession ? {} : {
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
          }),
        },
      })
      setBookingSuccess(true)
      setBookingMsg(`Booking submitted for ${numTravelers} traveler(s) — pending confirmation.`)
    } catch (err) {
      setBookingMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="page"><p style={{ color: 'var(--color-text-muted)' }}>Loading trip...</p></div>
  if (error)   return <div className="page"><p className="msg-error">{error}</p></div>
  if (!tripPackage)  return null

  return (
    <div>
      {/* Hero */}
      <div style={{
        height: 360,
        backgroundImage: tripPackage.image_url ? `url(${tripPackage.image_url})` : `url(https://images.unsplash.com/photo-1784296271493-5c624c4eb50d?w=1920&auto=format&fit=crop&q=80)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,36,25,0.95) 0%, rgba(15,36,25,0.3) 60%, transparent 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '0 1.5rem 2rem' }}>
          {tripPackage.categories?.length > 0 && (
            <span className="badge badge-gold" style={{ marginBottom: 10, display: 'inline-block' }}>
              {tripPackage.categories.map(c => c.name).join(' · ')}
            </span>
          )}
          <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 8 }}>{tripPackage.title}</h1>
          <p style={{ color: 'rgba(240,242,255,0.75)', fontSize: '0.95rem' }}>
            📅 {new Date(tripPackage.start_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' – '}
            {new Date(tripPackage.end_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
            &nbsp;·&nbsp; 📍 {tripPackage.destination}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '2rem', alignItems: 'start' }}
          className="lg:grid-cols-[1fr_340px]">

          {/* Left — description + itinerary */}
          <div>
            <h2 style={{ fontWeight: 700, marginBottom: 12 }}>About this trip</h2>
            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 24 }}>
              {tripPackage.description || 'No description provided.'}
            </p>
            {tripPackage.itinerary && (
              <>
                <h2 style={{ fontWeight: 700, marginBottom: 12 }}>Itinerary</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 24 }}>
                  {tripPackage.itinerary}
                </p>
              </>
            )}
            <WeatherWidget destination={tripPackage.destination} />
          </div>

          {/* Right — booking panel */}
          <div className="card" style={{ position: 'sticky', top: 76 }}>
            <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Book This Trip</h3>

            {tripPackage.spots_remaining === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                This trip is fully booked.
              </p>
            ) : bookingSuccess ? (
              <div>
                <p className="msg-success" style={{ fontSize: '1rem' }}>✓ {bookingMsg}</p>
                {isTravelerSession && (
                  <Link to="/traveler/tickets" className="btn-primary" style={{ marginTop: 12, width: '100%' }}>
                    View My Bookings
                  </Link>
                )}
              </div>
            ) : (
              <>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 12 }}>
                  KES {tripPackage.price} per traveler · {tripPackage.spots_remaining} spots left
                </p>

                <div style={{ marginBottom: 16 }}>
                  <label>Number of Travelers</label>
                  <input
                    type="number"
                    min="1"
                    max={tripPackage.spots_remaining}
                    value={numTravelers}
                    onChange={e => setNumTravelers(Math.max(1, Number(e.target.value)))}
                  />
                </div>

                {totalPrice && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderTop: '1px solid var(--color-border)', marginBottom: 16, fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Total</span>
                    <strong style={{ color: 'var(--color-primary)', fontSize: '1.1rem' }}>KES {totalPrice}</strong>
                  </div>
                )}

                {!isAuthenticated && !showBookingForm && (
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowBookingForm(true)}>
                    Book This Trip
                  </button>
                )}

                {(isTravelerSession || showBookingForm) && (
                  <form onSubmit={handleBooking}>
                    {!isTravelerSession && (
                      <>
                        <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                          Enter your details so we can send your itinerary:
                        </p>
                        <div style={{ marginBottom: 10 }}>
                          <label>Full Name</label>
                          <input value={guestName} onChange={e => setGuestName(e.target.value)} required placeholder="Your full name" />
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <label>Email Address</label>
                          <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)} required placeholder="your@email.com" />
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <label>Phone Number</label>
                          <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} required placeholder="+254 7XX XXX XXX" />
                        </div>
                      </>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <label>Mode of Payment</label>
                      <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                        {PAYMENT_METHODS.map(pm => (
                          <option key={pm.value} value={pm.value}>{pm.label}</option>
                        ))}
                      </select>
                    </div>

                    <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={submitting}>
                      {submitting ? 'Submitting...' : 'Confirm Booking'}
                    </button>
                    {cancellationPolicy && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 8, textAlign: 'center' }}>
                        {cancellationPolicy}
                      </p>
                    )}
                    {!isTravelerSession && (
                      <button type="button" className="btn-ghost" style={{ width: '100%', marginTop: 8 }} onClick={() => setShowBookingForm(false)}>
                        Back
                      </button>
                    )}
                    {bookingMsg && <p className="msg-error" style={{ marginTop: 8 }}>{bookingMsg}</p>}
                  </form>
                )}

                {isAuthenticated && role !== 'traveler' && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                    You are viewing as {role}. Bookings are for travelers only.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}