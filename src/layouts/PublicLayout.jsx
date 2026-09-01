import { Outlet } from 'react-router-dom'
import PublicNavbar from '../components/navbars/PublicNavbar'

export default function PublicLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <PublicNavbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
      <footer style={{ borderTop: '1px solid var(--color-border)', padding: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        © {new Date().getFullYear()} SafariADV — All rights reserved
      </footer>
    </div>
  )
}
