/**
 * WeatherWidget
 *
 * Shown on a trip package's details page. Defaults to a real 7-day
 * forecast for the destination; switching to 1/3/6 months shows a
 * historical-average summary instead (labelled as such — free weather
 * APIs don't forecast that far ahead).
 */

import { useEffect, useState } from 'react'
import { geocodeDestination, fetchForecast, fetchHistoricalSummary, summarizeDaily } from '../api/weather'

const PERIODS = [
  { value: 'week', label: 'Next 7 Days' },
  { value: 'month', label: 'Past Month (typical)' },
  { value: '3months', label: 'Past 3 Months (typical)' },
  { value: '6months', label: 'Past 6 Months (typical)' },
]

export default function WeatherWidget({ destination }) {
  const [period, setPeriod] = useState('week')
  const [location, setLocation] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Geocode once per destination
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    geocodeDestination(destination)
      .then(loc => { if (!cancelled) setLocation(loc) })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [destination])

  // Fetch weather whenever location or period changes
  useEffect(() => {
    if (!location) return
    let cancelled = false
    setLoading(true)
    setError('')

    const load = period === 'week'
      ? fetchForecast(location.latitude, location.longitude)
      : fetchHistoricalSummary(location.latitude, location.longitude, period)

    load
      .then(daily => { if (!cancelled) setSummary(summarizeDaily(daily)) })
      .catch(err => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [location, period])

  return (
    <div className="card">
      <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Weather Guide</h3>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={p.value === period ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '0.3rem 0.7rem', fontSize: '0.75rem' }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Loading weather...</p>}
      {error && <p className="msg-error">{error}</p>}

      {!loading && !error && summary && (
        <div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-primary)' }}>{summary.avgHigh}°C</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Avg High</div>
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.avgLow}°C</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Avg Low</div>
            </div>
            <div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{summary.rainyPct}%</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Days with Rain</div>
            </div>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 10 }}>
            <strong style={{ color: 'var(--color-text)' }}>What to pack: </strong>
            {summary.clothing}
          </p>

          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Dress norms vary a lot by place, especially at religious sites or in more conservative
            areas — it's worth a quick search on local customs for {destination} before you pack,
            so you're dressed respectfully once you arrive.
          </p>

          {period !== 'week' && (
            <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 10, fontStyle: 'italic' }}>
              Based on last year's weather for this period — a guide to typical conditions, not a forecast.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
