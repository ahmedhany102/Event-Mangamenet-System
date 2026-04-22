import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AdminEventControlPanel from '../components/admin/AdminEventControlPanel'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
  description: string | null
  venue: string | null
  start_date: string
  end_date: string
  status: string
  vip_code: string | null
  speaker_code: string | null
  capacity: number
}

type EventAttendeeRow = {
  event_id: number
  attendance_status: 'registered' | 'attended' | string
}

type DashboardEventRow = {
  id: number
  name: string
  venue: string | null
  start_date: string
  end_date: string
  status: string
  capacity: number
  registeredCount: number
  attendedCount: number
}

type CreateEventForm = {
  name: string
  description: string
  start_date: string
  end_date: string
  venue: string
  capacity: string
  status: string
}

type EditEventForm = {
  id: number
  name: string
  description: string
  venue: string
  start_date: string
  end_date: string
  capacity: string
  status: string
}

const initialCreateForm: CreateEventForm = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  venue: '',
  capacity: '100',
  status: 'planned',
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function AdminDashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventAttendees, setEventAttendees] = useState<EventAttendeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<CreateEventForm>(initialCreateForm)
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditEventForm | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError(null)

    const [{ data: eventsData, error: eventsError }, { data: attendeesData, error: attendeesError }] =
      await Promise.all([
        supabase
          .from('events')
          .select('id,name,description,venue,start_date,end_date,status,vip_code,speaker_code,capacity')
          .order('start_date', { ascending: true }),
        supabase.from('event_attendees').select('event_id,attendance_status'),
      ])

    const firstError = eventsError || attendeesError

    if (firstError) {
      setError(firstError.message)
      setEvents([])
      setEventAttendees([])
    } else {
      setEvents((eventsData as EventRow[]) ?? [])
      setEventAttendees((attendeesData as EventAttendeeRow[]) ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  function generateAccessCode(prefix: 'VIP' | 'SPK') {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const bytes = new Uint8Array(6)

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256)
      }
    }

    const randomPart = Array.from(bytes, (byte) => chars[byte % chars.length]).join('')
    return `${prefix}-${randomPart}`
  }

  function validateCreateForm() {
    if (!createForm.name.trim()) return 'Name is required.'
    if (!createForm.start_date || !createForm.end_date) return 'Start date and end date are required.'
    if (!createForm.capacity.trim() || Number(createForm.capacity) <= 0) return 'Capacity must be greater than 0.'
    if (new Date(createForm.start_date) >= new Date(createForm.end_date)) {
      return 'Start date must be before end date.'
    }
    return null
  }

  async function handleCreateEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setCreateError(null)
    setCreateSuccess(null)

    const validationError = validateCreateForm()
    if (validationError) {
      setCreateError(validationError)
      return
    }

    setCreateLoading(true)

    const vipCode = generateAccessCode('VIP')
    const speakerCode = generateAccessCode('SPK')

    const payload = {
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
      start_date: createForm.start_date,
      end_date: createForm.end_date,
      venue: createForm.venue.trim() || null,
      capacity: Number(createForm.capacity),
      status: createForm.status,
      vip_code: vipCode,
      speaker_code: speakerCode,
    }

    const { data, error: insertError } = await supabase.from('events').insert(payload).select('*').single()

    if (insertError) {
      setCreateError(insertError.message)
      setCreateLoading(false)
      return
    }

    const insertedEvent = data as EventRow
    setEvents((prev) => [...prev, insertedEvent].sort((a, b) => a.start_date.localeCompare(b.start_date)))
    setCreateSuccess(`Event created. VIP Code: ${vipCode}, Speaker Code: ${speakerCode}`)
    setCreateForm(initialCreateForm)
    setCreateLoading(false)
  }

  const dashboardRows = useMemo<DashboardEventRow[]>(() => {
    return events.map((event) => {
      const rows = eventAttendees.filter((row) => row.event_id === event.id)
      const registeredCount = rows.length
      const attendedCount = rows.filter((row) => row.attendance_status === 'attended').length

      return {
        ...event,
        registeredCount,
        attendedCount,
      }
    })
  }, [eventAttendees, events])

  function startEditEvent(event: EventRow) {
    setEditError(null)
    setEditForm({
      id: event.id,
      name: event.name,
      description: event.description ?? '',
      venue: event.venue ?? '',
      start_date: event.start_date,
      end_date: event.end_date,
      capacity: String(event.capacity ?? 100),
      status: event.status,
    })
  }

  async function saveEditEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!editForm) return

    setEditError(null)

    if (!editForm.name.trim()) {
      setEditError('Name is required.')
      return
    }

    if (new Date(editForm.start_date) >= new Date(editForm.end_date)) {
      setEditError('Start date must be before end date.')
      return
    }

    if (!editForm.capacity.trim() || Number(editForm.capacity) <= 0) {
      setEditError('Capacity must be greater than 0.')
      return
    }

    setEditLoading(true)

    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim() || null,
      venue: editForm.venue.trim() || null,
      start_date: editForm.start_date,
      end_date: editForm.end_date,
      capacity: Number(editForm.capacity),
      status: editForm.status,
    }

    const { error: updateError } = await supabase.from('events').update(payload).eq('id', editForm.id)

    if (updateError) {
      setEditError(updateError.message)
      setEditLoading(false)
      return
    }

    await loadDashboard()
    setEditLoading(false)
    setEditForm(null)
  }

  async function handleDeleteEvent(eventId: number) {
    const shouldDelete = window.confirm('Delete this event? This action cannot be undone.')
    if (!shouldDelete) return

    setDeleteLoadingId(eventId)
    setError(null)

    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId)

    if (deleteError) {
      setError(deleteError.message)
      setDeleteLoadingId(null)
      return
    }

    await loadDashboard()
    setDeleteLoadingId(null)
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Single control center for event operations, check-in, and analytics.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            {showCreateForm ? 'Close Create Form' : 'Create Event'}
          </button>
        </div>
      </header>

      {showCreateForm ? (
        <form onSubmit={handleCreateEvent} className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-slate-900">Create Event</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="create-name" className="mb-1 block text-sm font-medium text-slate-700">
                Name
              </label>
              <input
                id="create-name"
                type="text"
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="create-venue" className="mb-1 block text-sm font-medium text-slate-700">
                Venue (Optional)
              </label>
              <input
                id="create-venue"
                type="text"
                value={createForm.venue}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, venue: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="create-start" className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                id="create-start"
                type="date"
                value={createForm.start_date}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, start_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="create-end" className="mb-1 block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                id="create-end"
                type="date"
                value={createForm.end_date}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, end_date: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="create-description" className="mb-1 block text-sm font-medium text-slate-700">
                Description
              </label>
              <textarea
                id="create-description"
                rows={3}
                value={createForm.description}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="create-capacity" className="mb-1 block text-sm font-medium text-slate-700">
                Capacity
              </label>
              <input
                id="create-capacity"
                type="number"
                min="1"
                value={createForm.capacity}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, capacity: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="create-status" className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="create-status"
                value={createForm.status}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="planned">planned</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
          </div>

          {createError ? <p className="text-sm font-medium text-rose-700">{createError}</p> : null}
          {createSuccess ? <p className="text-sm font-medium text-emerald-700">{createSuccess}</p> : null}

          <button
            type="submit"
            disabled={createLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {createLoading ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      ) : null}

      {editForm ? (
        <form onSubmit={saveEditEvent} className="mb-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold text-slate-900">Edit Event</h2>
            <button
              type="button"
              onClick={() => setEditForm(null)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-name" className="mb-1 block text-sm font-medium text-slate-700">Name</label>
              <input
                id="edit-name"
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-venue" className="mb-1 block text-sm font-medium text-slate-700">Venue</label>
              <input
                id="edit-venue"
                type="text"
                value={editForm.venue}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, venue: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="edit-start" className="mb-1 block text-sm font-medium text-slate-700">Start Date</label>
              <input
                id="edit-start"
                type="date"
                value={editForm.start_date}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, start_date: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-end" className="mb-1 block text-sm font-medium text-slate-700">End Date</label>
              <input
                id="edit-end"
                type="date"
                value={editForm.end_date}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, end_date: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-capacity" className="mb-1 block text-sm font-medium text-slate-700">Capacity</label>
              <input
                id="edit-capacity"
                type="number"
                min="1"
                value={editForm.capacity}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, capacity: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-status" className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, status: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="planned">planned</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
              <textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {editError ? <p className="text-sm font-medium text-rose-700">{editError}</p> : null}

          <button
            type="submit"
            disabled={editLoading}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {editLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      ) : null}

      {selectedEventId ? (
        <AdminEventControlPanel
          eventId={selectedEventId}
          onBack={() => setSelectedEventId(null)}
          onDataChanged={loadDashboard}
        />
      ) : null}

      {!selectedEventId && loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading dashboard data...</div>
      ) : null}

      {!selectedEventId && !loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      {!selectedEventId && !loading && !error && dashboardRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No events available.</div>
      ) : null}

      {!selectedEventId && !loading && !error && dashboardRows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Event Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Venue</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Capacity</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Registered</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Attended</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {dashboardRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{row.name}</td>
                  <td className="px-4 py-3 text-slate-700">{row.venue || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(row.start_date)} - {formatDate(row.end_date)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 capitalize">{row.status}</td>
                  <td className="px-4 py-3 text-slate-700">{row.capacity}</td>
                  <td className="px-4 py-3 text-slate-700">{row.registeredCount}</td>
                  <td className="px-4 py-3 text-slate-700">{row.attendedCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedEventId(row.id)}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Open Event
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const source = events.find((event) => event.id === row.id)
                          if (source) startEditEvent(source)
                        }}
                        className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800"
                      >
                        Edit Event
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(row.id)}
                        disabled={deleteLoadingId === row.id}
                        className="rounded-md border border-rose-300 px-3 py-1.5 text-xs font-medium text-rose-700 disabled:opacity-60"
                      >
                        {deleteLoadingId === row.id ? 'Deleting...' : 'Delete Event'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}
