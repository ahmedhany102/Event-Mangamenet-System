import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminDashboardPage from './pages/AdminDashboardPage'
import EventDetailsPage from './pages/EventDetailsPage'
import EventsPage from './pages/EventsPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'

function App() {
  const navigate = useNavigate()
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  function handleLogout() {
    localStorage.removeItem('isAdmin')
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
            EMS
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            <NavLink
              to={isAdmin ? '/admin' : '/login'}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Admin
            </NavLink>

            <NavLink
              to="/events"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Events
            </NavLink>

            {isAdmin ? (
              <>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />

        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/check-in" element={<Navigate to="/admin" replace />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/events" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/events/:id" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/events/create" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/checkin" element={<Navigate to="/admin" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
