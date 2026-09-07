import { Outlet } from 'react-router-dom'
import AgentNavbar from '../components/navbars/AgentNavbar'

export default function AgentLayout() {
  return (
    <>
      <AgentNavbar />
      <main>
        <Outlet />
      </main>
    </>
  )
}