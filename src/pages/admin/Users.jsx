// src/pages/admin/Users.jsx
// User management with Activate/Deactivate/Delete

import { useState, useEffect } from "react";
import { FaCheck, FaTimes, FaTrash, FaUserCheck, FaUserSlash } from "react-icons/fa";
import { toast } from "react-hot-toast";
import ConfirmDialog from "../../components/common/ConfirmDialog";

function AdminUsers() {
  const [users, setUsers] = useState([]);
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
      setUsers([
        { id: 1, name: "Peris Kairetu", email: "peris@example.com", role: "admin", status: "active" },
        { id: 2, name: "Silvernus Kiprotich", email: "silvernus@example.com", role: "agent", status: "active" },
        { id: 3, name: "Ramesh Kumar", email: "ramesh@example.com", role: "agent", status: "pending" },
        { id: 4, name: "Jane Doe", email: "jane@example.com", role: "user", status: "active" },
        { id: 5, name: "John Smith", email: "john@example.com", role: "user", status: "deactivated" },
        { id: 6, name: "Alice Wang", email: "alice@example.com", role: "agent", status: "pending" },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case "active": return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Active</span>;
      case "pending": return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">Pending</span>;
      case "deactivated": return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Deactivated</span>;
      default: return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">Unknown</span>;
    }
  };

  const handleActivate = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: "active" } : u));
    toast.success("User activated successfully");
  };

  const handleDeactivate = (userId) => {
    setUsers(users.map(u => u.id === userId ? { ...u, status: "deactivated" } : u));
    toast.success("User deactivated successfully");
  };

  const handleDelete = (userId, userName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      onConfirm: () => {
        setUsers(users.filter(u => u.id !== userId));
        toast.success("User deleted successfully");
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
        <div className="text-white">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">User Management</h1>
        <p className="text-gray-400 mt-1">Manage all users on the platform</p>
      </div>

      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900">
              <tr>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Name</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Email</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Role</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Status</th>
                <th className="px-6 py-3 text-gray-400 text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-zinc-700 hover:bg-zinc-750">
                  <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-gray-400">{user.email}</td>
                  <td className="px-6 py-4 text-gray-300 capitalize">{user.role}</td>
                  <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.status === "pending" && (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                        >
                          <FaCheck size={12} /> Activate
                        </button>
                      )}
                      {user.status === "active" && (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                        >
                          <FaUserSlash size={12} /> Deactivate
                        </button>
                      )}
                      {user.status === "deactivated" && (
                        <button
                          onClick={() => handleActivate(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                        >
                          <FaUserCheck size={12} /> Reactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1 transition"
                      >
                        <FaTrash size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm || (() => {})}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default AdminUsers;