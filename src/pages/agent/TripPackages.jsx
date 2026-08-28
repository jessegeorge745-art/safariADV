// src/pages/agent/TripPackages.jsx
// List of trips with Create and Edit modals

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEdit, FaEye, FaChartBar, FaPlus } from "react-icons/fa";
import CreateTripPackage from "./CreateTripPackage";
import EditTripPackage from "./EditTripPackage";
import { toast } from "react-hot-toast";

function AgentTripPackages() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setTrips([
        {
          id: 1,
          title: "Safari Adventure",
          destination: "Maasai Mara",
          description: "3-day safari experience in the Maasai Mara",
          itinerary: "Day 1: Arrive... Day 2: Game drive... Day 3: Return",
          start_date: "2026-09-15",
          end_date: "2026-09-18",
          price: 45000,
          capacity: 12,
          status: "approved",
          image: "",
        },
        {
          id: 2,
          title: "Beach Getaway",
          destination: "Diani Beach",
          description: "5-day beach holiday in Diani",
          itinerary: "Day 1: Arrive... Day 2: Water sports...",
          start_date: "2026-10-01",
          end_date: "2026-10-06",
          price: 35000,
          capacity: 8,
          status: "pending",
          image: "",
        },
        {
          id: 3,
          title: "Mountain Trek",
          destination: "Mt. Kenya",
          description: "4-day hiking expedition",
          itinerary: "Day 1: Start hike...",
          start_date: "2026-08-20",
          end_date: "2026-08-24",
          price: 28000,
          capacity: 10,
          status: "rejected",
          image: "",
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleTripCreated = (newTrip) => {
    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleEditClick = (trip) => {
    setEditingTrip(trip);
    setIsEditModalOpen(true);
  };

  const handleTripUpdated = (updatedTrip) => {
    setTrips((prev) =>
      prev.map((trip) =>
        trip.id === updatedTrip.id ? updatedTrip : trip
      )
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading your trips...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">My Trips</h1>
          <p className="text-gray-400 mt-1">Manage all your trip packages</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition"
        >
          <FaPlus />
          Create New Trip
        </button>
      </div>

      {/* Trip Cards Grid */}
      {trips.length === 0 ? (
        <div className="text-center py-12 bg-zinc-800 rounded-xl border border-zinc-700">
          <p className="text-gray-400 text-lg">No trips found</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-amber-400 hover:text-amber-300 mt-2 inline-block"
          >
            Create your first trip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden hover:border-zinc-600 transition"
            >
              {/* Image placeholder */}
              <div className="h-48 bg-zinc-700 flex items-center justify-center">
                {trip.image ? (
                  <img
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500">No image</span>
                )}
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-white truncate">
                    {trip.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      trip.status
                    )}`}
                  >
                    {trip.status}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mt-1">{trip.destination}</p>
                <p className="text-gray-400 text-sm mt-2">
                  {trip.start_date} → {trip.end_date}
                </p>
                <p className="text-amber-400 font-semibold mt-2">
                  Ksh {trip.price.toLocaleString()}
                </p>
                <p className="text-gray-500 text-sm">
                  Capacity: {trip.capacity} people
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Link
                    to={`/agent/trips/${trip.id}/orders`}
                    className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm py-2 rounded-lg transition text-center"
                  >
                    <FaEye className="inline mr-1" /> Orders
                  </Link>
                  <button
                    onClick={() => handleEditClick(trip)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 rounded-lg transition text-center"
                  >
                    <FaEdit className="inline mr-1" /> Edit
                  </button>
                  <Link
                    to={`/agent/trips/${trip.id}/analytics`}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm py-2 rounded-lg transition text-center"
                  >
                    <FaChartBar className="inline mr-1" /> Stats
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Trip Modal */}
      <CreateTripPackage
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onTripCreated={handleTripCreated}
      />

      {/* Edit Trip Modal */}
      <EditTripPackage
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTrip(null);
        }}
        trip={editingTrip}
        onTripUpdated={handleTripUpdated}
      />
    </div>
  );
}

export default AgentTripPackages;