// src/pages/agent/TripPackageAnalytics.jsx
// Analytics for a specific trip

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaArrowLeft,
  FaUsers,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaChartBar,
} from "react-icons/fa";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function TripPackageAnalytics() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTrip({
        id: parseInt(id),
        title: "Safari Adventure",
        destination: "Maasai Mara",
        start_date: "2026-09-15",
        end_date: "2026-09-18",
        price: 45000,
        capacity: 12,
      });

      setBookings([
        {
          id: 101,
          passenger_name: "John Doe",
          num_travelers: 2,
          total_price: 90000,
          status: "confirmed",
          booking_date: "2026-08-10",
        },
        {
          id: 102,
          passenger_name: "Jane Smith",
          num_travelers: 1,
          total_price: 45000,
          status: "pending",
          booking_date: "2026-08-12",
        },
        {
          id: 103,
          passenger_name: "Bob Johnson",
          num_travelers: 3,
          total_price: 135000,
          status: "confirmed",
          booking_date: "2026-08-14",
        },
        {
          id: 104,
          passenger_name: "Alice Brown",
          num_travelers: 2,
          total_price: 90000,
          status: "cancelled",
          booking_date: "2026-08-15",
        },
        {
          id: 105,
          passenger_name: "Charlie White",
          num_travelers: 1,
          total_price: 45000,
          status: "confirmed",
          booking_date: "2026-08-16",
        },
        {
          id: 106,
          passenger_name: "Diana Black",
          num_travelers: 2,
          total_price: 90000,
          status: "pending",
          booking_date: "2026-08-18",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [id]);

  const confirmedBookings = bookings.filter(
    (b) => b.status === "confirmed" || b.status === "completed"
  );
  const pendingBookings = bookings.filter((b) => b.status === "pending");
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled");

  const totalTravelers = confirmedBookings.reduce(
    (sum, b) => sum + b.num_travelers,
    0
  );
  const totalRevenue = confirmedBookings.reduce(
    (sum, b) => sum + b.total_price,
    0
  );
  const occupancyRate = trip?.capacity
    ? Math.round((totalTravelers / trip.capacity) * 100)
    : 0;

  const statusData = [
    { name: "Confirmed", value: confirmedBookings.length, color: "#22c55e" },
    { name: "Pending", value: pendingBookings.length, color: "#eab308" },
    { name: "Cancelled", value: cancelledBookings.length, color: "#ef4444" },
  ].filter((item) => item.value > 0);

  const dailyData = bookings.reduce((acc, b) => {
    const date = b.booking_date || "unknown";
    if (!acc[date]) acc[date] = 0;
    acc[date] += 1;
    return acc;
  }, {});

  const chartData = Object.entries(dailyData).map(([date, count]) => ({
    date: date,
    bookings: count,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/agent/trips"
          className="text-gray-400 hover:text-white flex items-center gap-2 mb-4"
        >
          <FaArrowLeft /> Back to Trips
        </Link>
        <h1 className="text-3xl font-bold text-white">
          {trip?.title} - Analytics
        </h1>
        <p className="text-gray-400 mt-1">
          {trip?.destination} • {trip?.start_date} → {trip?.end_date}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaUsers className="text-blue-400 text-xl" />
            <div>
              <p className="text-gray-400 text-sm">Travelers Booked</p>
              <p className="text-2xl font-bold text-white">{totalTravelers}</p>
              <p className="text-gray-500 text-xs">
                Out of {trip?.capacity} capacity
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaMoneyBillWave className="text-amber-400 text-xl" />
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-amber-400">
                Ksh {totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaCalendarCheck className="text-green-400 text-xl" />
            <div>
              <p className="text-gray-400 text-sm">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-green-400">
                {confirmedBookings.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaChartBar className="text-purple-400 text-xl" />
            <div>
              <p className="text-gray-400 text-sm">Occupancy Rate</p>
              <p className="text-2xl font-bold text-white">{occupancyRate}%</p>
              <div className="w-full h-1.5 bg-zinc-700 rounded-full mt-1">
                <div
                  className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, occupancyRate)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Bookings Chart */}
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <h3 className="text-white font-semibold mb-4">Daily Bookings</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="date" stroke="#a1a1aa" fontSize={12} />
                  <YAxis stroke="#a1a1aa" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                  <Bar dataKey="bookings" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No booking data available
            </p>
          )}
        </div>

        {/* Status Pie Chart */}
        <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700">
          <h3 className="text-white font-semibold mb-4">
            Booking Status Breakdown
          </h3>
          {statusData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#a1a1aa" }}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e4e4e7" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-center py-8">
              No booking data available
            </p>
          )}
        </div>
      </div>

      {/* Detailed Booking List */}
      <div className="bg-zinc-800 rounded-xl p-5 border border-zinc-700 mt-6">
        <h3 className="text-white font-semibold mb-4">All Bookings</h3>
        {bookings.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No bookings yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-zinc-700">
                  <th className="pb-2">Passenger</th>
                  <th className="pb-2">Travelers</th>
                  <th className="pb-2">Total</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-zinc-700/50">
                    <td className="py-3 text-white">{booking.passenger_name}</td>
                    <td className="py-3 text-gray-400">
                      {booking.num_travelers}
                    </td>
                    <td className="py-3 text-amber-400">
                      Ksh {booking.total_price.toLocaleString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === "confirmed" ||
                          booking.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default TripPackageAnalytics;