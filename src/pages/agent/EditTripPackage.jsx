import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'
import TripPackageForm from '../../components/forms/TripPackageForm'

export default function EditTripPackage() {
  const { token } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    apiRequest(`/trip_packages/${id}`, { token })
      .then(setTrip)
      .catch(err => setError(err.message))
  }, [id, token])

  function handleSubmit(formData) {
    setError('')
    setSubmitting(true)
    apiRequest(`/trip_packages/${id}`, {
      method: 'PUT',
      token,
      body: {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
      },
    })
      .then(() => navigate('/agent/trip_packages'))
      .catch(err => setError(err.message))
      .finally(() => setSubmitting(false))
  }

  if (!trip) return error ? <p className="msg-error">{error}</p> : <p>Loading…</p>

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1>Edit Trip Package</h1>
      {error && <p className="msg-error">{error}</p>}
      <TripPackageForm
        initialData={trip}
        submitLabel="Save Changes"
        isSubmitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/agent/trip_packages')}
      />
    </div>
  )
}
