// src/pages/admin/Reports.jsx
// Detailed reports with charts (revenue over time, top trips, top destinations)

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { FaMoneyBillWave, FaSuitcase, FaMapMarkerAlt } from "react-icons/fa";

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState([]);
  const [topTrips, setTopTrips] = useState([]);
  const [topDestinations, setTopDestinations] = useState([]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setRevenueData([
        { month: "Jan", revenue: 120000 },
        { month: "Feb", revenue: 150000 },
        { month: "Mar", revenue: 180000 },
        { month: "Apr", revenue: 220000 },
        { month: "May", revenue: 200000 },
        { month: "Jun", revenue: 250000 },
        { month: "Jul", revenue: 300000 },
      ]);

      setTopTrips([
        { name: "Safari Adventure", revenue: 450000, bookings: 12 },
        { name: "Beach Getaway", revenue: 280000, bookings: 8 },
        { name: "Lamu Island Tour", revenue: 210000, bookings: 5 },
        { name: "Mountain Trek", revenue: 168000, bookings: 6 },
        { name: "Lake Nakuru Safari", revenue: 152000, bookings: 4 },
      ]);

      setTopDestinations([
        { name: "Maasai Mara", value: 18 },
        { name: "Diani Beach", value: 12 },
        { name: "Lamu", value: 8 },
        { name: "Mt. Kenya", value: 7 },
        { name: "Lake Nakuru", value: 5 },
      ]);

      setLoading(false);
    }, 500);
  }, []);

  const COLORS = ["#f59e0b", "#3b82f6", "#22c55e", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
        <p className="text-gray-400 mt-1">Detailed insights into your platform performance</p>
      </div>

      {/* Revenue Chart */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <FaMoneyBillWave className="text-green-400 text-xl" />
          <h2 className="text-xl font-semibold text-white">Revenue Over Time</h2>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="month" stroke="#a1a1aa" fontSize={12} />
              <YAxis stroke="#a1a1aa" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                labelStyle={{ color: "#e4e4e7" }}
                formatter={(value) => `Ksh ${value.toLocaleString()}`}
              />
              <Bar dataKey="revenue" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Trips & Destinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Trips by Revenue */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaSuitcase className="text-amber-400 text-xl" />
            <h2 className="text-xl font-semibold text-white">Top Trips by Revenue</h2>
          </div>
          <div className="space-y-3">
            {topTrips.map((trip, index) => (
              <div key={index} className="flex items-center justify-between border-b border-zinc-700 pb-2">
                <div>
                  <p className="text-white font-medium">{trip.name}</p>
                  <p className="text-gray-400 text-sm">{trip.bookings} bookings</p>
                </div>
                <p className="text-amber-400 font-semibold">Ksh {trip.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Top Destinations */}
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FaMapMarkerAlt className="text-red-400 text-xl" />
            <h2 className="text-xl font-semibold text-white">Top Destinations</h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topDestinations}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: "#a1a1aa" }}
                >
                  {topDestinations.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px" }}
                  labelStyle={{ color: "#e4e4e7" }}
                />
                <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReports;