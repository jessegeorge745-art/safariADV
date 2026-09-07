import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div>
      <h1>Agent Dashboard</h1>
      <div className="card">
        <Link className="btn-primary" to="/agent/trip_packages">My Trip Packages</Link>
        <Link className="btn-primary" to="/agent/trip_packages/create">Create Trip Package</Link>
      </div>
    </div>
  )
}