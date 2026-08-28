// src/pages/admin/TripPackages.jsx
// Moderate all trips – Approve, Reject, Blacklist

import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaBan, FaEye } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function AdminTripPackages() {
  const [trips, setTrips] = useState([]);
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
      setTrips([
        { id: 1, title: "Safari Adventure", destination: "Maasai Mara", agent: "Silvernus Kiprotich", status: "pending", price: 45000 },
        { id: 2, title: "Beach Getaway", destination: "Diani Beach", agent: "Ramesh Kumar", status: "approved", price: 35000 },
        { id: 3, title: "Mountain Trek", destination: "Mt. Kenya", agent: "Peris Kairetu", status: "rejected", price: 28000 },
        { id: 4, title: "Lake Nakuru Safari", destination: "Lake Nakuru", agent: "Silvernus Kiprotich", status: "pending", price: 38000 },
        { id: 5, title: "Lamu Island Tour", destination: "Lamu", agent: "Ramesh Kumar", status: "approved", price: 42000 },
        { id: 6, title: "Amboseli National Park", destination: "Amboseli", agent: "Peris Kairetu", status: "blacklisted", price: 50000 },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Approved</span>;
      case "pending": return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case "rejected": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Rejected</span>;
      case "blacklisted": return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Blacklisted</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  const handleApprove = (tripId) => {
    setTrips(trips.map(t => t.id === tripId ? { ...t, status: "approved" } : t));
    toast.success("Trip approved successfully");
  };

  const handleReject = (tripId) => {
    setTrips(trips.map(t => t.id === tripId ? { ...t, status: "rejected" } : t));
    toast.success("Trip rejected");
  };

  const handleBlacklist = (tripId, tripTitle) => {
    setConfirmDialog({
      isOpen: true,
      title: "Blacklist Trip",
      message: `Are you sure you want to blacklist "${tripTitle}"? This will cancel all pending/confirmed bookings for this trip.`,
      onConfirm: () => {
        setTrips(trips.map(t => t.id === tripId ? { ...t, status: "blacklisted" } : t));
        toast.success("Trip blacklisted. All bookings cancelled.");
        setConfirmDialog({ ...confirmDialog, isOpen: false });
      },
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, isOpen: false });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading trips...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Trip Moderation</h1>
        <p className="text-gray-400 mt-1">Approve, reject, or blacklist trip packages</p>
      </div>

      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Title</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Destination</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Agent</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Price</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((trip) => (
                <tr key={trip.id} className="border-t border-zinc-700 hover:bg-zinc-750">
                  <td className="px-6 py-4 text-white font-medium">{trip.title}</td>
                  <td className="px-6 py-4 text-gray-400">{trip.destination}</td>
                  <td className="px-6 py-4 text-gray-300">{trip.agent}</td>
                  <td className="px-6 py-4 text-amber-400">Ksh {trip.price.toLocaleString()}</td>
                  <td className="px-6 py-4">{getStatusBadge(trip.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 flex-wrap">
                      {trip.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(trip.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                          >
                            <FaCheck size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(trip.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                          >
                            <FaTimes size={12} /> Reject
                          </button>
                        </>
                      )}
                      {trip.status === "approved" && (
                        <>
                          <button
                            onClick={() => handleReject(trip.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                          >
                            <FaTimes size={12} /> Reject
                          </button>
                          <button
                            onClick={() => handleBlacklist(trip.id, trip.title)}
                            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                          >
                            <FaBan size={12} /> Blacklist
                          </button>
                        </>
                      )}
                      {trip.status === "rejected" && (
                        <button
                          onClick={() => handleApprove(trip.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                        >
                          <FaCheck size={12} /> Approve
                        </button>
                      )}
                      {trip.status === "blacklisted" && (
                        <span className="text-gray-500 text-sm">No actions</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
        confirmText="Blacklist"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default AdminTripPackages;