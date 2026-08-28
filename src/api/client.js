/**
 * apiRequest — central HTTP client for the SafariADV frontend.
 *
 * All API calls go through here so the base URL and auth header are
 * applied in one place. If the server returns a non-OK response, the
 * function throws with the backend's error message so components can
 * display it directly.
 *
 * Usage:
 *   apiRequest('/trip_packages')                              // public GET
 *   apiRequest('/trip_packages', { token })                   // authenticated GET
 *   apiRequest('/bookings', { method:'POST', token, body:{...} })
 */

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

export async function apiRequest(path, { method = 'GET', token = null, body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  let data
  try {
    data = await res.json()
  } catch {
    data = {}
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed (${res.status})`)
  }

  return data
}

export async function refreshAuthSession(refreshToken) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    token: refreshToken,
  })
}
