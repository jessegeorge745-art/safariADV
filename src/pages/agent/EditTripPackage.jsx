import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'

export default function EditTripPackage() {
  const { token } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiRequest(`/trip_packages/${id}`, { token })
      .then(t => setForm({
        title: t.title || '',
        destination: t.destination || '',
        description: t.description || '',
        itinerary: t.itinerary || '',
        start_date: t.start_date?.slice(0, 10) || '',
        end_date: t.end_date?.slice(0, 10) || '',
        price: t.price ?? '',
        capacity: t.capacity ?? '',
        image_url: t.image_url || ''
      }))
      .catch(err => setError(err.message))
  }, [id, token])

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    apiRequest(`/trip_packages/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...form,
        price: Number(form.price),
        capacity: Number(form.capacity)
      }
    })
      .then(() => navigate('/agent/trip_packages'))
      .catch(err => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  if (!form) return error ? <p className="msg-error">{error}</p> : <p>Loading…</p>

  return (
    <div className="card">
      <h1>Edit Trip Package</h1>
      {error && <p className="msg-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <label>Title
          <input value={form.title} onChange={set('title')} required />
        </label>
        <label>Destination
          <input value={form.destination} onChange={set('destination')} required />
        </label>
        <label>Description
          <textarea value={form.description} onChange={set('description')} />
        </label>
        <label>Itinerary
          <textarea value={form.itinerary} onChange={set('itinerary')} />
        </label>
        <label>Start Date
          <input type="date" value={form.start_date} onChange={set('start_date')} required />
        </label>
        <label>End Date
          <input type="date" value={form.end_date} onChange={set('end_date')} required />
        </label>
        <label>Price
          <input type="number" min="0" value={form.price} onChange={set('price')} required />
        </label>
        <label>Capacity
          <input type="number" min="1" value={form.capacity} onChange={set('capacity')} required />
        </label>
        <label>Image URL
          <input value={form.image_url} onChange={set('image_url')} />
        </label>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}