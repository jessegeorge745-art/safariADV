// src/pages/admin/Dashboard.jsx
// Admin dashboard with stats and cancellation policy editor

import { useState, useEffect } from "react";
import { FaUsers, FaSuitcase, FaMoneyBillWave, FaClock, FaEdit, FaSave } from "react-icons/fa";
import { toast } from "react-hot-toast";

function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTrips: 0,
    totalRevenue: 0,
    pendingTrips: 0,
  });
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [isEditingPolicy, setIsEditingPolicy] = useState(false);
  const [policyInput, setPolicyInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        totalUsers: 145,
        totalTrips: 32,
        totalRevenue: 1875000,
        pendingTrips: 5,
      });
      setCancellationPolicy(
        "Cancellations made 7 days before departure receive a 90% refund. " +
        "Cancellations made 3-6 days before departure receive a 50% refund. " +
        "Cancellations made less than 3 days before departure receive no refund."
      );
      setPolicyInput(
        "Cancellations made 7 days before departure receive a 90% refund. " +
        "Cancellations made 3-6 days before departure receive a 50% refund. " +
        "Cancellations made less than 3 days before departure receive no refund."
      );
      setLoading(false);
    }, 500);
  }, []);

  const handleSavePolicy = () => {
    setCancellationPolicy(policyInput);
    setIsEditingPolicy(false);
    toast.success("Cancellation policy updated successfully!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-gray-400 mt-1">Overview of your platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaUsers className="text-blue-400 text-2xl" />
            <div>
              <p className="text-gray-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaSuitcase className="text-amber-400 text-2xl" />
            <div>
              <p className="text-gray-400 text-sm">Total Trips</p>
              <p className="text-2xl font-bold text-white">{stats.totalTrips}</p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaMoneyBillWave className="text-green-400 text-2xl" />
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-400">
                Ksh {stats.totalRevenue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
          <div className="flex items-center gap-3">
            <FaClock className="text-yellow-400 text-2xl" />
            <div>
              <p className="text-gray-400 text-sm">Pending Trips</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.pendingTrips}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Policy Editor */}
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Cancellation Policy</h2>
            <p className="text-gray-400 text-sm">Shown to travelers when booking</p>
          </div>
          {!isEditingPolicy ? (
            <button
              onClick={() => setIsEditingPolicy(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
            >
              <FaEdit /> Edit Policy
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsEditingPolicy(false);
                  setPolicyInput(cancellationPolicy);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white border border-zinc-600 rounded-lg hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePolicy}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
              >
                <FaSave /> Save Policy
              </button>
            </div>
          )}
        </div>
        {!isEditingPolicy ? (
          <p className="text-gray-300 leading-relaxed">{cancellationPolicy}</p>
        ) : (
          <textarea
            value={policyInput}
            onChange={(e) => setPolicyInput(e.target.value)}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-zinc-600 bg-zinc-900 text-white focus:border-amber-500 focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;