import { useEffect, useState } from 'react'
import EventCard from '../components/EventCard'
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

export default function EventsPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('events')
        .select('*')
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

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upcoming Events</h1>
          <p className="mt-2 text-sm text-slate-600">Browse events and open any event to register instantly.</p>
        </div>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading events...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load events: {error}
        </div>
      ) : null}

      {!loading && !error && events.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No events found.
        </div>
      ) : null}

      {!loading && !error && events.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      ) : null}
    </section>
  )
}