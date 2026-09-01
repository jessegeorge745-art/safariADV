/**
 * App.jsx — full route map for SafariADV
 *
 * Structure:
 *   PublicLayout   — anyone (no auth required)
 *   TravelerLayout — ProtectedRoute(['traveler'])
 *   AgentLayout— ProtectedRoute(['agent'])
 *   AdminLayout    — ProtectedRoute(['admin'])
 *
 * Navbar shown depends entirely on which layout is active:
 *   Public    → PublicNavbar  (only Agent Login button)
 *   Traveler  → TravelerNavbar
 *   Agent → AgentNavbar
 *   Admin     → AdminNavbar
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import ProtectedRoute from './components/ProtectedRoute'

// Layouts
import PublicLayout from './layouts/PublicLayout'
import TravelerLayout from './layouts/TravelerLayout'
import AgentLayout from './layouts/AgentLayout'
import AdminLayout from './layouts/AdminLayout'

// Public pages
import Home from './pages/public/Home'
import TripPackages from './pages/public/TripPackages'
import TripPackageDetails from './pages/public/TripPackageDetails'
import About from './pages/public/About'
import Contact from './pages/public/Contact'

// Auth pages
import TravelerLogin from './pages/auth/TravelerLogin'
import TravelerRegister from './pages/auth/TravelerRegister'
import AgentLogin from './pages/auth/AgentLogin'
import AgentRegister from './pages/auth/AgentRegister'
import AdminLogin from './pages/auth/AdminLogin'
import ForgotPassword from './pages/auth/ForgotPassword'
import ResetPassword from './pages/auth/ResetPassword'

// Traveler pages
import TravelerDashboard from './pages/traveler/Dashboard'
import TravelerTickets from './pages/traveler/Tickets'
import TravelerOrders from './pages/traveler/Orders'
import TravelerProfile from './pages/traveler/Profile'

// Agent pages
import AgentDashboard from './pages/agent/Dashboard'
import AgentTripPackages from './pages/agent/TripPackages'
import CreateTripPackage from './pages/agent/CreateTripPackage'
import EditTripPackage from './pages/agent/EditTripPackage'
import TripPackageOrders from './pages/agent/TripPackageOrders'
import TripPackageAnalytics from './pages/agent/TripPackageAnalytics'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminTripPackages from './pages/admin/TripPackages'
import AdminOrders from './pages/admin/Orders'
import AdminReports from './pages/admin/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public (no auth needed) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/trip_packages" element={<TripPackages />} />
            <Route path="/trip_packages/:id" element={<TripPackageDetails />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Auth entry points */}
            <Route path="/traveler/login" element={<TravelerLogin />} />
            <Route path="/traveler/register" element={<TravelerRegister />} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/agent/register" element={<AgentRegister />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Traveler only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['traveler']}>
                <TravelerLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/traveler/dashboard" element={<TravelerDashboard />} />
            <Route path="/traveler/tickets" element={<TravelerTickets />} />
            <Route path="/traveler/orders" element={<TravelerOrders />} />
            <Route path="/traveler/profile" element={<TravelerProfile />} />
          </Route>

          {/* Agent only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['agent']}>
                <AgentLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/agent/trip_packages" element={<AgentTripPackages />} />
            <Route path="/agent/trip_packages/create" element={<CreateTripPackage />} />
            <Route path="/agent/trip_packages/:id/edit" element={<EditTripPackage />} />
            <Route path="/agent/trip_packages/:id/orders" element={<TripPackageOrders />} />
            <Route path="/agent/trip_packages/:id/analytics" element={<TripPackageAnalytics />} />
          </Route>

          {/* Admin only */}
          <Route
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/trip_packages" element={<AdminTripPackages />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/reports" element={<AdminReports />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

