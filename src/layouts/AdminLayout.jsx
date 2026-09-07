import { Outlet } from 'react-router-dom'
import AdminNavbar from '../components/navbars/AdminNavbar'

export default function AdminLayout() {
  return (
    <>
      <AdminNavbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}