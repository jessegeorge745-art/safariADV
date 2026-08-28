// src/pages/agent/TripPackageOrders.jsx
// View bookings for a specific trip with status management

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaArrowLeft, FaCheck, FaTimes } from "react-icons/fa";
import { toast } from "react-hot-toast";

function TripPackageOrders() {
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
      });

      setBookings([
        {
          id: 101,
          passenger_name: "John Doe",
          email: "john@example.com",
          num_travelers: 2,
          total_price: 90000,
          status: "confirmed",
          booking_date: "2026-08-10",
        },
        {
          id: 102,
          passenger_name: "Jane Smith",
          email: "jane@example.com",
          num_travelers: 1,
          total_price: 45000,
          status: "pending",
          booking_date: "2026-08-12",
        },
        {
          id: 103,
          passenger_name: "Bob Johnson",
          email: "bob@example.com",
          num_travelers: 3,
          total_price: 135000,
          status: "confirmed",
          booking_date: "2026-08-14",
        },
        {
          id: 104,
          passenger_name: "Alice Brown",
          email: "alice@example.com",
          num_travelers: 2,
          total_price: 90000,
          status: "cancelled",
          booking_date: "2026-08-15",
        },
      ]);
      setLoading(false);
    }, 500);
  }, [id]);

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getNextStatuses = (status) => {
    switch (status) {
      case "pending":
        return ["confirmed", "cancelled"];
      case "confirmed":
        return ["completed", "cancelled"];
      default:
        return [];
    }
  };

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? { ...booking, status: newStatus }
          : booking
      )
    );
    toast.success(`Booking ${newStatus} successfully!`);
  };

  const getTotalRevenue = () => {
    return bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.total_price, 0);
  };

  const getTotalTravelers = () => {
    return bookings
      .filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + b.num_travelers, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading bookings...</div>
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
          {trip?.title} - Bookings
        </h1>
        <p className="text-gray-400 mt-1">
          {trip?.destination} • Manage all bookings for this trip
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <p className="text-gray-400 text-sm">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{bookings.length}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <p className="text-gray-400 text-sm">Confirmed</p>
          <p className="text-2xl font-bold text-green-400">
            {bookings.filter((b) => b.status === "confirmed" || b.status === "completed").length}
          </p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <p className="text-gray-400 text-sm">Total Travelers</p>
          <p className="text-2xl font-bold text-blue-400">{getTotalTravelers()}</p>
        </div>
        <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
          <p className="text-gray-400 text-sm">Revenue</p>
          <p className="text-2xl font-bold text-amber-400">
            Ksh {getTotalRevenue().toLocaleString()}
          </p>
        </div>
      </div>

      {/* Bookings Table */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-xl border border-zinc-700">
          <p className="text-gray-400 text-lg">No bookings found for this trip</p>
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-900">
                <tr>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Passenger</th>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Email</th>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Travelers</th>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Total</th>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                  <th className="px-6 py-3 text-gray-400 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const nextStatuses = getNextStatuses(booking.status);
                  const isTerminal = booking.status === "cancelled" || booking.status === "completed";

                  return (
                    <tr key={booking.id} className="border-t border-zinc-700 hover:bg-zinc-750">
                      <td className="px-6 py-4 text-white font-medium">
                        {booking.passenger_name}
                      </td>
                      <td className="px-6 py-4 text-gray-400">{booking.email}</td>
                      <td className="px-6 py-4 text-white">{booking.num_travelers}</td>
                      <td className="px-6 py-4 text-amber-400 font-semibold">
                        Ksh {booking.total_price.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-3 py-1 rounded-full ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {isTerminal ? (
                          <span className="text-gray-500 text-sm">No actions</span>
                        ) : (
                          <div className="flex gap-2">
                            {nextStatuses.includes("confirmed") && (
                              <button
                                onClick={() => handleStatusChange(booking.id, "confirmed")}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                              >
                                <FaCheck size={12} /> Confirm
                              </button>
                            )}
                            {nextStatuses.includes("completed") && (
                              <button
                                onClick={() => handleStatusChange(booking.id, "completed")}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                              >
                                <FaCheck size={12} /> Complete
                              </button>
                            )}
                            {nextStatuses.includes("cancelled") && (
                              <button
                                onClick={() => handleStatusChange(booking.id, "cancelled")}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                              >
                                <FaTimes size={12} /> Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default TripPackageOrders;