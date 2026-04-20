import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('events')
        .select('id,name,description,start_date,end_date,status')
        .order('start_date', { ascending: true })

      if (queryError) {
        setError(queryError.message)
        setEvents([])
      } else {
        setEvents((data as EventRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchEvents()
  }, [])

  async function handleDelete(eventId: number) {
    const confirmed = window.confirm('Delete this event?')
    if (!confirmed) return

    setDeletingId(eventId)
    setError(null)

    const { error: deleteError } = await supabase.from('events').delete().eq('id', eventId)

    if (deleteError) {
      setError(deleteError.message)
      setDeletingId(null)
      return
    }

    setEvents((prev) => prev.filter((event) => event.id !== eventId))
    setDeletingId(null)
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manage Events</h1>
          <p className="mt-2 text-sm text-slate-600">Create, edit, and remove events.</p>
        </div>
        <Link
          to="/admin/events/create"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Event
        </Link>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading events...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No events found.</div>
      ) : null}

      {!loading && !error && events.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Event</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{event.name}</p>
                    <p className="line-clamp-1 text-xs text-slate-600">{event.description || 'No description'}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatDate(event.start_date)} - {formatDate(event.end_date)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold capitalize text-slate-700">
                      {event.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/admin/events/${event.id}`}
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/admin/events/${event.id}/edit`}
                        className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        disabled={deletingId === event.id}
                        className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === event.id ? 'Deleting...' : 'Delete'}
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