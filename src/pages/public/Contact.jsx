import { useState } from 'react'

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function set(key) {
    return (e) => setForm({ ...form, [key]: e.target.value })
  }

  function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="card" style={{ maxWidth: 480, margin: '2rem auto' }}>
      <h1>Contact Us</h1>
      {submitted ? (
        <p className="msg-success">Thanks — we'll get back to you soon.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>
            Name
            <input value={form.name} onChange={set('name')} required />
          </label>
          <label>
            Email
            <input type="email" value={form.email} onChange={set('email')} required />
          </label>
          <label>
            Message
            <textarea value={form.message} onChange={set('message')} required />
          </label>
          <button type="submit" className="btn-primary">Send</button>
        </form>
      )}
    </div>
  )
}