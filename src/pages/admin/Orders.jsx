// src/pages/admin/Orders.jsx
// All bookings platform-wide with status management

import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaClock } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function AdminOrders() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setBookings([
        { id: 101, passenger: "John Doe", trip: "Safari Adventure", travelers: 2, total: 90000, status: "confirmed", date: "2026-08-10" },
        { id: 102, passenger: "Jane Smith", trip: "Beach Getaway", travelers: 1, total: 35000, status: "pending", date: "2026-08-12" },
        { id: 103, passenger: "Bob Johnson", trip: "Mountain Trek", travelers: 3, total: 84000, status: "completed", date: "2026-08-14" },
        { id: 104, passenger: "Alice Brown", trip: "Lake Nakuru Safari", travelers: 2, total: 76000, status: "cancelled", date: "2026-08-15" },
        { id: 105, passenger: "Charlie White", trip: "Safari Adventure", travelers: 1, total: 45000, status: "confirmed", date: "2026-08-16" },
        { id: 106, passenger: "Diana Black", trip: "Lamu Island Tour", travelers: 2, total: 84000, status: "pending", date: "2026-08-18" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Confirmed</span>;
      case "pending": return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case "cancelled": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Cancelled</span>;
      case "completed": return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Completed</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  const getNextStatuses = (status) => {
    switch (status) {
      case "pending": return ["confirmed", "cancelled"];
      case "confirmed": return ["completed", "cancelled"];
      default: return [];
    }
  };

  const handleStatusChange = (bookingId, newStatus) => {
    setBookings(bookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
    toast.success(`Booking ${newStatus} successfully!`);
  };

  const handleCancelWithConfirm = (bookingId, passenger) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Booking",
      message: `Are you sure you want to cancel the booking for "${passenger}"?`,
      onConfirm: () => {
        handleStatusChange(bookingId, "cancelled");
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  const totalRevenue = bookings
    .filter(b => b.status === "confirmed" || b.status === "completed")
    .reduce((sum, b) => sum + b.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading bookings...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">All Orders</h1>
        <p className="text-gray-400 mt-1">Manage all bookings platform-wide</p>
        <div className="mt-2 bg-zinc-800 rounded-lg p-3 inline-block">
          <p className="text-amber-400 font-semibold">
            Total Revenue (Confirmed/Completed): Ksh {totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Passenger</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Trip</th>
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
                    <td className="px-6 py-4 text-white font-medium">{booking.passenger}</td>
                    <td className="px-6 py-4 text-gray-400">{booking.trip}</td>
                    <td className="px-6 py-4 text-white">{booking.travelers}</td>
                    <td className="px-6 py-4 text-amber-400">Ksh {booking.total.toLocaleString()}</td>
                    <td className="px-6 py-4">{getStatusBadge(booking.status)}</td>
                    <td className="px-6 py-4">
                      {isTerminal ? (
                        <span className="text-gray-500 text-sm">No actions</span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
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
                              onClick={() => handleCancelWithConfirm(booking.id, booking.passenger)}
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Cancel"
        cancelText="Close"
        variant="danger"
      />
    </div>
  );
}

export default AdminOrders;