// src/pages/agent/Dashboard.jsx
// Simple landing page for agents after login

import { Link } from "react-router-dom";
import { FaPlus, FaList, FaChartBar, FaTickets } from "react-icons/fa";

function AgentDashboard() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Agent Dashboard</h1>
        <p className="text-gray-400 mt-1">Manage your trips, bookings, and analytics</p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <p className="text-gray-400 text-sm">Total Trips</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <p className="text-gray-400 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold text-white">0</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <p className="text-gray-400 text-sm">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">0</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <p className="text-gray-400 text-sm">Revenue</p>
          <p className="text-2xl font-bold text-green-400">Ksh 0</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/agent/trips/create"
          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-6 border border-zinc-700 transition text-center"
        >
          <FaPlus className="text-3xl text-amber-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold">Create Trip</h3>
          <p className="text-gray-400 text-sm">Add a new trip package</p>
        </Link>

        <Link
          to="/agent/trips"
          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-6 border border-zinc-700 transition text-center"
        >
          <FaList className="text-3xl text-blue-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold">My Trips</h3>
          <p className="text-gray-400 text-sm">View all your trips</p>
        </Link>

        <Link
          to="/agent/trips"
          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-6 border border-zinc-700 transition text-center"
        >
          <FaTickets className="text-3xl text-green-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold">Bookings</h3>
          <p className="text-gray-400 text-sm">Manage trip bookings</p>
        </Link>

        <Link
          to="/agent/trips"
          className="bg-zinc-800 hover:bg-zinc-700 rounded-xl p-6 border border-zinc-700 transition text-center"
        >
          <FaChartBar className="text-3xl text-purple-400 mx-auto mb-3" />
          <h3 className="text-white font-semibold">Analytics</h3>
          <p className="text-gray-400 text-sm">View trip performance</p>
        </Link>
      </div>
    </div>
  );
}

export default AgentDashboard;