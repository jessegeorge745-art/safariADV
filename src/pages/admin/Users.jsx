import { useEffect, useState } from 'react'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function Users() {
  const { token } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    apiRequest('/admin/users', { token })
      .then(setUsers)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [token])

  function setStatus(id, status) {
    apiRequest(`/admin/users/${id}`, { method: 'PUT', token, body: { status } })
      .then(load)
      .catch(err => setError(err.message))
  }

  function deleteUser(id) {
    apiRequest(`/admin/users/${id}`, { method: 'DELETE', token })
      .then(load)
      .catch(err => setError(err.message))
  }

  if (loading) return <p>Loading…</p>
  if (error) return <p className="msg-error">{error}</p>

  return (
    <div>
      <h1>Users</h1>
      <table>
        <thead>
          <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.status}</td>
              <td>
                {u.status !== 'active' && (
                  <button className="btn-ghost" onClick={() => setStatus(u.id, 'active')}>Activate</button>
                )}
                {u.status === 'active' && (
                  <button className="btn-ghost" onClick={() => setStatus(u.id, 'deactivated')}>Deactivate</button>
                )}
                <button className="btn-ghost" onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}