/**
 * AuthProvider
 *
 * Persists the session in localStorage so a page refresh keeps the user
 * logged in. The JWT token and user object are both stored together under
 * one key. On mount, the saved session is read synchronously so there is
 * no flash of "not logged in" on first render.
 *
 * role is read directly from user.role (set by the backend on every
 * login / register response) — the role check happens in ProtectedRoute.
 */

import { useState } from 'react'
import { apiRequest, refreshAuthSession } from '../api/client'
import AuthContext from './authContext'

const STORAGE_KEY = 'travel_app_auth'

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { user: null, token: null, refreshToken: null }
  } catch {
    return { user: null, token: null, refreshToken: null }
  }
}

export function AuthProvider({ children }) {
  const [{ user, token, refreshToken }, setSession] = useState(readSession)

  function saveSession(user, token, refreshToken = null) {
    setSession({ user, token, refreshToken })
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token, refreshToken }))
  }

  function clearSession() {
    setSession({ user: null, token: null, refreshToken: null })
    localStorage.removeItem(STORAGE_KEY)
  }

  // role = 'traveler' | 'agent' | 'admin'
  async function login(role, { email, password }) {
    const data = await apiRequest(`/auth/${role}/login`, {
      method: 'POST',
      body: { email, password },
    })
    saveSession(data.user, data.access_token, data.refresh_token)
    return data.user
  }

  async function registerTraveler({ name, email, phone, password }) {
    return apiRequest('/auth/traveler/register', {
      method: 'POST',
      body: { name, email, phone, password },
    })
  }

  async function registerAgent({ name, email, phone, password, businessName }) {
    return apiRequest('/auth/agent/register', {
      method: 'POST',
      body: { name, email, phone, password, business_name: businessName },
    })
  }

  async function refreshSession() {
    if (!refreshToken) return null
    const data = await refreshAuthSession(refreshToken)
    saveSession(data.user, data.access_token, data.refresh_token)
    return data.access_token
  }

  function logout() {
    clearSession()
  }

  // Called after PUT /auth/me succeeds, so the rest of the app (navbar,
  // etc.) reflects the change immediately instead of only after the next
  // login.
  function updateUser(updatedUser) {
    saveSession(updatedUser, token, refreshToken)
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      refreshToken,
      refreshSession,
      isAuthenticated: Boolean(user),
      role: user?.role ?? null,
      login,
      registerTraveler,
      registerAgent,
      updateUser,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
