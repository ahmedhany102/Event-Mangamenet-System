import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
  venue: string | null
  description: string | null
  start_date: string
  end_date: string
  status: string
  capacity: number | null
}

type EventAttendeeRow = {
  event_id: number
}

type RuntimeStatus = 'upcoming' | 'live' | 'finished'

function getRuntimeStatus(startDate: string, endDate: string): RuntimeStatus {
  const now = new Date()
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (now < start) return 'upcoming'
  if (now > end) return 'finished'
  return 'live'
}

function statusLabel(status: RuntimeStatus) {
  if (status === 'upcoming') return 'Upcoming'
  if (status === 'live') return 'Live'
  return 'Finished'
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [eventAttendees, setEventAttendees] = useState<EventAttendeeRow[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | RuntimeStatus>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      setError(null)

      const [{ data: eventsData, error: eventsError }, { data: attendeesData, error: attendeesError }] =
        await Promise.all([
          supabase.from('events').select('id,name,venue,description,start_date,end_date,status,capacity').order('start_date', { ascending: true }),
          supabase.from('event_attendees').select('event_id'),
        ])

      const queryError = eventsError ?? attendeesError

      if (queryError) {
        setError(queryError.message)
        setEvents([])
        setEventAttendees([])
      } else {
        const rows = (eventsData as EventRow[]) ?? []

        setEvents(rows)
        setEventAttendees((attendeesData as EventAttendeeRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchEvents()
  }, [])

  const registrationCountByEvent = eventAttendees.reduce<Map<number, number>>((acc, row) => {
    acc.set(row.event_id, (acc.get(row.event_id) ?? 0) + 1)
    return acc
  }, new Map<number, number>())

  const filteredEvents = events.filter((event) => {
    const runtimeStatus = getRuntimeStatus(event.start_date, event.end_date)
    const matchesStatus = statusFilter === 'all' || runtimeStatus === statusFilter
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    return matchesStatus && matchesSearch
  })

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Events</h1>
          <p className="mt-2 text-sm text-slate-600">Find events by title and track their real-time status.</p>
        </div>
      </header>

      <div className="mb-8 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="event-search" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search by event name
          </label>
          <input
            id="event-search"
            type="text"
            placeholder="Type event name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="status-filter" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | RuntimeStatus)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="live">Live</option>
            <option value="finished">Finished</option>
          </select>
        </div>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        Showing <span className="font-semibold text-slate-900">{filteredEvents.length}</span> event(s)
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading events...</div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">Failed to load events: {error}</div>
      ) : null}

      {!loading && !error && filteredEvents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">No events found for this filter.</div>
      ) : null}

      {!loading && !error && filteredEvents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => {
            const runtimeStatus = getRuntimeStatus(event.start_date, event.end_date)
            const registrations = registrationCountByEvent.get(event.id) ?? 0
            const isFull = event.capacity !== null && registrations >= event.capacity

            return (
              <EventCard
                key={event.id}
                event={{
                  ...event,
                  venue: event.venue ?? 'TBA',
                  status: statusLabel(runtimeStatus),
                }}
                isFull={isFull}
              />
            )
          })}
        </div>
      ) : null}
    </section>
  )
}