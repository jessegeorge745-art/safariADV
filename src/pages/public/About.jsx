const BG = 'https://images.unsplash.com/photo-1771634915026-5a778ee7be19?w=1920&auto=format&fit=crop&q=80'

export default function About() {
  return (
    <div>
      <div style={{ position: 'relative', height: 240, backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15,36,25,0.9) 0%, rgba(15,36,25,0.5) 100%)' }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>About SafariADV</h1>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          SafariADV is a travel management platform built for travelers and agents who believe planning a trip should be easy, and booking it even easier.
        </p>
        <p style={{ lineHeight: 1.8, color: 'var(--color-text-muted)', marginBottom: 24 }}>
          Whether you're planning a safari, a beach getaway, or a city break — SafariADV gives agents the tools to publish trip packages and travelers a simple way to find and book them, without the friction of spreadsheets and phone calls.
        </p>
        <p style={{ lineHeight: 1.8, color: 'var(--color-text-muted)' }}>
          For guests, browsing is always free and open. No account needed to discover what's on. When you're ready to book, the process takes less than a minute.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginTop: 40 }}>
          {[['🎟', 'Instant booking'], ['📊', 'Real-time sales'], ['🔒', 'Secure & verified'], ['🌍', 'Pan-Africa ready']].map(([icon, label]) => (
            <div key={label} className="card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>{icon}</div>
              <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}