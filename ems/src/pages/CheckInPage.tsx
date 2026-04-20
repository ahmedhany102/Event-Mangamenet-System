import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type EventOption = {
  id: number
  name: string
}

type TicketRow = {
  id: number
  event_id: number
  attendee_id: number
  ticket_code: string
  is_checked_in: boolean
}

type EventAttendeeRow = {
  attendance_status: 'registered' | 'attended' | string
}

function parseTicketInput(input: string) {
  const trimmed = input.trim()

  if (!trimmed) {
    return null
  }

  try {
    const parsed = JSON.parse(trimmed) as { ticket_code?: unknown; event_id?: unknown }
    const ticketCode = typeof parsed.ticket_code === 'string' ? parsed.ticket_code.trim() : ''
    const qrEventId =
      typeof parsed.event_id === 'number'
        ? parsed.event_id
        : typeof parsed.event_id === 'string'
          ? Number(parsed.event_id)
          : Number.NaN

    if (ticketCode && !Number.isNaN(qrEventId)) {
      return {
        source: 'qr' as const,
        ticketCode,
        qrEventId,
      }
    }
  } catch {
    // Allow manual ticket code input
  }

  return {
    source: 'manual' as const,
    ticketCode: trimmed,
    qrEventId: null,
  }
}

export default function CheckInPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  const [ticketInput, setTicketInput] = useState('')
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvents() {
      setLoadingEvents(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('events')
        .select('id,name')
        .order('start_date', { ascending: true })

      if (queryError) {
        setError(queryError.message)
        setEvents([])
      } else {
        setEvents((data as EventOption[]) ?? [])
      }

      setLoadingEvents(false)
    }

    void fetchEvents()
  }, [])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const eventId = Number(selectedEventId)
    if (!selectedEventId || Number.isNaN(eventId)) {
      setError('Please select an event')
      return
    }

    const parsedInput = parseTicketInput(ticketInput)
    if (!parsedInput) {
      setError('Ticket code or QR payload is required')
      return
    }

    if (parsedInput.qrEventId !== null && parsedInput.qrEventId !== eventId) {
      setError('This ticket does not belong to this event')
      return
    }

    setLoading(true)

    const ticketLookupQuery = supabase.from('tickets').select('*').eq('ticket_code', parsedInput.ticketCode)

    const { data, error: fetchError } =
      parsedInput.source === 'qr' && parsedInput.qrEventId !== null
        ? await ticketLookupQuery.eq('event_id', parsedInput.qrEventId).single()
        : await ticketLookupQuery.single()

    if (fetchError) {
      const notFound = fetchError.code === 'PGRST116'
      setError(notFound ? 'Invalid ticket' : fetchError.message)
      setLoading(false)
      return
    }

    const ticket = data as TicketRow

    if (ticket.event_id !== eventId) {
      setError('This ticket does not belong to this event')
      setLoading(false)
      return
    }

    const { data: eventAttendeeData, error: eventAttendeeError } = await supabase
      .from('event_attendees')
      .select('attendance_status')
      .eq('event_id', ticket.event_id)
      .eq('attendee_id', ticket.attendee_id)
      .single()

    if (eventAttendeeError) {
      const notFound = eventAttendeeError.code === 'PGRST116'
      setError(notFound ? 'Registration record not found for this ticket' : eventAttendeeError.message)
      setLoading(false)
      return
    }

    const eventAttendee = eventAttendeeData as EventAttendeeRow

    if (eventAttendee.attendance_status === 'attended') {
      setError('Already checked in')
      setLoading(false)
      return
    }

    if (ticket.is_checked_in) {
      setError('Already checked in')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase
      .from('tickets')
      .update({ is_checked_in: true })
      .eq('id', ticket.id)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    const { error: attendanceUpdateError } = await supabase
      .from('event_attendees')
      .update({ attendance_status: 'attended' })
      .eq('event_id', ticket.event_id)
      .eq('attendee_id', ticket.attendee_id)

    if (attendanceUpdateError) {
      setError(attendanceUpdateError.message)
      setLoading(false)
      return
    }

    setSuccess('Check-in successful and attendance recorded')
    setSelectedEventId('')
    setTicketInput('')
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Check-In</h1>
      <p className="mt-2 text-sm text-slate-600">
        Select an event, then scan QR JSON or enter ticket code to record attendance.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="event_id" className="mb-1 block text-sm font-medium text-slate-700">
            Event
          </label>
          <select
            id="event_id"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
            disabled={loadingEvents}
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={String(event.id)}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="ticket_input" className="mb-1 block text-sm font-medium text-slate-700">
            Ticket Code or QR Payload
          </label>
          <input
            id="ticket_input"
            type="text"
            value={ticketInput}
            onChange={(e) => setTicketInput(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

        <div>
          <button
            type="submit"
            disabled={loading || loadingEvents}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'Check In'}
          </button>
        </div>
      </form>
    </section>
  )
}