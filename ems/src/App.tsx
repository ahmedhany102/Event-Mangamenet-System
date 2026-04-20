import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminEventDetailsPage from './pages/AdminEventDetailsPage'
import AdminEventsPage from './pages/AdminEventsPage'
import AttendeesPage from './pages/AttendeesPage'
import CreateAttendeePage from './pages/CreateAttendeePage'
import CreateEmployeePage from './pages/CreateEmployeePage'
import CreateEventPage from './pages/CreateEventPage'
import CreateOrganizationPage from './pages/CreateOrganizationPage'
import CreateTaskPage from './pages/CreateTaskPage'
import DashboardPage from './pages/DashboardPage'
import EditEventPage from './pages/EditEventPage'
import EmployeesPage from './pages/EmployeesPage'
import EventDetailsPage from './pages/EventDetailsPage'
import EventsPage from './pages/EventsPage'
import LoginPage from './pages/LoginPage'
import OrganizationsPage from './pages/OrganizationsPage'
import TasksPage from './pages/TasksPage'

function App() {
  const navigate = useNavigate()
  const isAdmin = localStorage.getItem('isAdmin') === 'true'

  function handleLogout() {
    localStorage.removeItem('isAdmin')
    navigate('/login', { replace: true })
  }

  const adminDashboardHref = isAdmin ? '/admin/dashboard' : '/login'

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-lg font-bold tracking-tight text-slate-900">
            EMS
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            <NavLink
              to={adminDashboardHref}
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Admin Dashboard
            </NavLink>

            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
              }
            >
              Events
            </NavLink>

            {isAdmin ? (
              <>
                <NavLink
                  to="/admin/events"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                  }
                >
                  Manage Events
                </NavLink>
                <NavLink
                  to="/admin/attendees"
                  className={({ isActive }) =>
                    `rounded-md px-3 py-2 ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`
                  }
                >
                  Attendees
                </NavLink>

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
        <Route path="/" element={<EventsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/events/:id" element={<EventDetailsPage />} />

        <Route path="/dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/events" element={<Navigate to="/" replace />} />
        <Route path="/check-in" element={<Navigate to="/admin/events" replace />} />
        <Route path="/employees" element={<Navigate to="/admin/employees" replace />} />
        <Route path="/employees/create" element={<Navigate to="/admin/employees/create" replace />} />
        <Route path="/organizations" element={<Navigate to="/admin/organizations" replace />} />
        <Route path="/organizations/create" element={<Navigate to="/admin/organizations/create" replace />} />
        <Route path="/tasks" element={<Navigate to="/admin/tasks" replace />} />
        <Route path="/tasks/create" element={<Navigate to="/admin/tasks/create" replace />} />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events"
          element={
            <ProtectedRoute>
              <AdminEventsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id"
          element={
            <ProtectedRoute>
              <AdminEventDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/create"
          element={
            <ProtectedRoute>
              <CreateEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/events/:id/edit"
          element={
            <ProtectedRoute>
              <EditEventPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendees"
          element={
            <ProtectedRoute>
              <AttendeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendees/create"
          element={
            <ProtectedRoute>
              <CreateAttendeePage />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/checkin" element={<Navigate to="/admin/events" replace />} />

        <Route
          path="/admin/organizations"
          element={
            <ProtectedRoute>
              <OrganizationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/organizations/create"
          element={
            <ProtectedRoute>
              <CreateOrganizationPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/employees"
          element={
            <ProtectedRoute>
              <EmployeesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/employees/create"
          element={
            <ProtectedRoute>
              <CreateEmployeePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <ProtectedRoute>
              <TasksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tasks/create"
          element={
            <ProtectedRoute>
              <CreateTaskPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default App
