/**
 * weather.js — thin wrapper around Open-Meteo (no API key required).
 *
 *   - geocodeDestination: turns a place name into lat/lon
 *   - fetchForecast: real 7-day forecast
 *   - fetchHistoricalSummary: pulls last year's data for the requested
 *     window as a stand-in "typical weather" guide — free tier forecasts
 *     don't reach 1-6 months out, so this is the honest way to give a
 *     multi-month picture.
 *
 * Base URLs come from env vars (see .env.example) even though this
 * provider needs no API key, so swapping providers later is a one-line
 * change rather than a code change.
 */

const GEOCODING_BASE   = import.meta.env.VITE_GEOCODING_API_BASE  || 'https://geocoding-api.open-meteo.com/v1'
const FORECAST_BASE    = import.meta.env.VITE_FORECAST_API_BASE   || 'https://api.open-meteo.com/v1'
const HISTORICAL_BASE  = import.meta.env.VITE_HISTORICAL_API_BASE || 'https://archive-api.open-meteo.com/v1'

export async function geocodeDestination(destination) {
  // "Diani, Kenya" -> use just the first comma-part; Open-Meteo's search
  // matches city/place names best on their own.
  const query = destination.split(',')[0].trim()
  const res = await fetch(`${GEOCODING_BASE}/search?name=${encodeURIComponent(query)}&count=1`)
  if (!res.ok) throw new Error('Could not look up that destination.')
  const data = await res.json()
  const place = data.results?.[0]
  if (!place) throw new Error(`No location found for "${destination}".`)
  return { latitude: place.latitude, longitude: place.longitude, name: place.name, country: place.country }
}

export async function fetchForecast(latitude, longitude) {
  const params = new URLSearchParams({
    latitude, longitude,
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    forecast_days: 7,
    timezone: 'auto',
  })
  const res = await fetch(`${FORECAST_BASE}/forecast?${params}`)
  if (!res.ok) throw new Error('Could not fetch the forecast.')
  const data = await res.json()
  return data.daily
}

// period: 'month' | '3months' | '6months' — approximated using the same
// calendar window one year ago, since free forecasts don't reach this far.
export async function fetchHistoricalSummary(latitude, longitude, period) {
  const daysBack = { month: 30, '3months': 90, '6months': 180 }[period]
  const end = new Date()
  end.setFullYear(end.getFullYear() - 1)
  const start = new Date(end)
  start.setDate(start.getDate() - daysBack)

  const fmt = d => d.toISOString().split('T')[0]
  const params = new URLSearchParams({
    latitude, longitude,
    start_date: fmt(start),
    end_date: fmt(end),
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum',
    timezone: 'auto',
  })
  const res = await fetch(`${HISTORICAL_BASE}/archive?${params}`)
  if (!res.ok) throw new Error('Could not fetch historical weather data.')
  const data = await res.json()
  return data.daily
}

// Turns a daily {temperature_2m_max, temperature_2m_min, precipitation_sum}
// series into a short, plain summary + a clothing suggestion.
export function summarizeDaily(daily) {
  const highs = daily.temperature_2m_max.filter(v => v != null)
  const lows = daily.temperature_2m_min.filter(v => v != null)
  const rain = daily.precipitation_sum.filter(v => v != null)

  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length
  const avgHigh = avg(highs)
  const avgLow = avg(lows)
  const rainyDays = rain.filter(v => v > 1).length
  const rainyPct = Math.round((rainyDays / rain.length) * 100)

  let clothing
  if (avgHigh >= 30) {
    clothing = 'Light, breathable fabrics (cotton or linen), sandals, a sun hat, and sunscreen — it runs hot.'
  } else if (avgHigh >= 22) {
    clothing = 'T-shirts and light layers during the day; bring a light jacket for cooler evenings.'
  } else if (avgHigh >= 14) {
    clothing = 'Layer up — a long-sleeve top with a jacket or sweater will cover most of the day.'
  } else {
    clothing = 'Pack warm layers: a proper coat, closed shoes, and something for your hands and head.'
  }

  if (rainyPct >= 40) {
    clothing += ' Rain is common in this window, so bring a waterproof jacket or umbrella.'
  }

  return {
    avgHigh: Math.round(avgHigh),
    avgLow: Math.round(avgLow),
    rainyPct,
    clothing,
  }
}
