import { Outlet } from 'react-router-dom'
import TravelerNavbar from '../components/navbars/TravelerNavbar'

export default function TravelerLayout() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <TravelerNavbar />
      <main className="page"><Outlet /></main>
    </div>
  )
}
