import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../api/client'
import { useAuth } from '../../context/useAuth'
import TripPackageForm from '../../components/forms/TripPackageForm'

export default function CreateTripPackage() {
  const { token } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleSubmit(formData) {
    setError('')
    setSubmitting(true)
    apiRequest('/trip_packages', {
      method: 'POST',
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

  return (
    <div className="card" style={{ maxWidth: 640 }}>
      <h1>Create Trip Package</h1>
      {error && <p className="msg-error">{error}</p>}
      <TripPackageForm
        submitLabel="Create Trip"
        isSubmitting={submitting}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/agent/trip_packages')}
      />
    </div>
  )
}
