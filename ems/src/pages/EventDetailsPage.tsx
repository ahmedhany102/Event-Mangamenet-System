import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  organization_id: number
  venue_id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  budget: number
  expenditure: number
  status: string
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatBudget(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

export default function EventDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    async function fetchEvent() {
      if (!id) {
        setError('Event id is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const eventId = Number(id)
      if (Number.isNaN(eventId)) {
        setError('Invalid event id.')
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (queryError) {
        setError(queryError.message)
        setEvent(null)
      } else {
        setEvent(data as EventRow)
      }

      setLoading(false)
    }

    void fetchEvent()
  }, [id])

  async function handleDelete() {
    if (!event || deleting) return

    const confirmed = window.confirm('Are you sure you want to delete this event?')
    if (!confirmed) return

    setDeleting(true)
    setError(null)

    const { error: deleteError } = await supabase.from('events').delete().eq('id', event.id)

    if (deleteError) {
      setError(deleteError.message)
      setDeleting(false)
      return
    }

    navigate('/events')
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Event Details</h1>
        <Link
          to="/events"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Events
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading event details...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      {!loading && !error && !event ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Event not found.
        </div>
      ) : null}

      {!loading && !error && event ? (
        <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">{event.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{event.description || 'No description provided.'}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
              {event.status}
            </span>
          </div>

          <dl className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Start Date</dt>
              <dd className="mt-1 font-medium text-slate-900">{formatDate(event.start_date)}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">End Date</dt>
              <dd className="mt-1 font-medium text-slate-900">{formatDate(event.end_date)}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Budget</dt>
              <dd className="mt-1 font-semibold text-slate-900">{formatBudget(event.budget)}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Organization ID</dt>
              <dd className="mt-1 font-medium text-slate-900">{event.organization_id}</dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <dt className="text-xs uppercase tracking-wide text-slate-500">Venue ID</dt>
              <dd className="mt-1 font-medium text-slate-900">{event.venue_id}</dd>
            </div>
          </dl>

          <div className="mt-6">
            <Link
              to={`/events/${event.id}/edit`}
              className="mr-3 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Edit Event
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </button>
          </div>
        </article>
      ) : null}
    </section>
  )
}