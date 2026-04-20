import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'

type EventOption = {
  id: number
  name: string
}

type AttendeeOption = {
  id: number
  full_name: string
  email: string
}

type FormState = {
  event_id: string
  attendee_id: string
  ticket_type: string
}

const initialForm: FormState = {
  event_id: '',
  attendee_id: '',
  ticket_type: 'regular',
}

function generateTicketCode() {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

  return `TKT-${randomPart}`
}

export default function EventRegistrationPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [attendees, setAttendees] = useState<AttendeeOption[]>([])
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [ticketCode, setTicketCode] = useState<string | null>(null)
  const [attendanceNumber, setAttendanceNumber] = useState<string | null>(null)
  const [qrPayload, setQrPayload] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    async function fetchOptions() {
      setLoadingOptions(true)
      setError(null)

      const [{ data: eventsData, error: eventsError }, { data: attendeesData, error: attendeesError }] =
        await Promise.all([
          supabase.from('events').select('id,name').order('id', { ascending: true }),
          supabase.from('attendees').select('id,full_name,email').order('id', { ascending: true }),
        ])

      if (eventsError) {
        setError(eventsError.message)
      }

      if (attendeesError) {
        setError(attendeesError.message)
      }

      setEvents((eventsData as EventOption[]) ?? [])
      setAttendees((attendeesData as AttendeeOption[]) ?? [])
      setLoadingOptions(false)
    }

    void fetchOptions()
  }, [])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    if (!form.event_id) return 'Event is required.'
    if (!form.attendee_id) return 'Attendee is required.'
    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setTicketCode(null)
    setAttendanceNumber(null)
    setQrPayload(null)

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const eventId = Number(form.event_id)
    const attendeeId = Number(form.attendee_id)

    const { data: existingRegistration, error: existingRegistrationError } = await supabase
      .from('event_attendees')
      .select('event_id,attendee_id')
      .eq('event_id', eventId)
      .eq('attendee_id', attendeeId)
      .maybeSingle()

    if (existingRegistrationError) {
      setError(existingRegistrationError.message)
      setLoading(false)
      return
    }

    if (existingRegistration) {
      setError('This attendee is already registered for the selected event.')
      setLoading(false)
      return
    }

    const payload = {
      event_id: eventId,
      attendee_id: attendeeId,
      ticket_type: form.ticket_type,
      attendance_status: 'registered',
    }

    const { error: insertError } = await supabase.from('event_attendees').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    let createdTicketCode: string | null = null
    let createdAttendanceNumber: string | null = null

    async function rollbackRegistration() {
      await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('attendee_id', attendeeId)
    }

    for (let i = 0; i < 3; i += 1) {
      const code = generateTicketCode()
      const { data: ticketData, error: ticketInsertError } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          attendee_id: attendeeId,
          ticket_code: code,
        })
        .select('id,ticket_code')
        .single()

      if (!ticketInsertError && ticketData) {
        createdTicketCode = ticketData.ticket_code
        createdAttendanceNumber = `ATT-${String(ticketData.id).padStart(6, '0')}`
        break
      }

      const isCodeConflict = ticketInsertError.message.toLowerCase().includes('ticket_code')
      if (isCodeConflict) {
        continue
      }

      await rollbackRegistration()
      setError(ticketInsertError.message)
      setLoading(false)
      return
    }

    if (!createdTicketCode || !createdAttendanceNumber) {
      await rollbackRegistration()
      setError('Could not generate a unique ticket code. Please try again.')
      setLoading(false)
      return
    }

    setSuccess('Registration successful — keep this QR code and attendance number for event entry.')
    setTicketCode(createdTicketCode)
    setAttendanceNumber(createdAttendanceNumber)
    setQrPayload(`EMS|${createdTicketCode}|${createdAttendanceNumber}`)
    setForm(initialForm)
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Event Registration</h1>
        <Link
          to="/attendees"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Attendees
        </Link>
      </div>

      {loadingOptions ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading events and attendees...
        </div>
      ) : null}

      {!loadingOptions && !error && (events.length === 0 || attendees.length === 0) ? (
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Please make sure events and attendees exist before registering.
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="event_id" className="mb-1 block text-sm font-medium text-slate-700">
            Event
          </label>
          <select
            id="event_id"
            value={form.event_id}
            onChange={(e) => updateField('event_id', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          >
            <option value="">Select event</option>
            {events.map((event) => (
              <option key={event.id} value={String(event.id)}>
                {event.id} - {event.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="attendee_id" className="mb-1 block text-sm font-medium text-slate-700">
            Attendee
          </label>
          <select
            id="attendee_id"
            value={form.attendee_id}
            onChange={(e) => updateField('attendee_id', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          >
            <option value="">Select attendee</option>
            {attendees.map((attendee) => (
              <option key={attendee.id} value={String(attendee.id)}>
                {attendee.id} - {attendee.full_name} ({attendee.email})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="ticket_type" className="mb-1 block text-sm font-medium text-slate-700">
              Ticket Type
            </label>
            <select
              id="ticket_type"
              value={form.ticket_type}
              onChange={(e) => updateField('ticket_type', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="regular">regular</option>
              <option value="vip">vip</option>
              <option value="student">student</option>
            </select>
          </div>
        </div>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}
        {ticketCode && attendanceNumber && qrPayload ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-900">Ticket Code: {ticketCode}</p>
            <p className="text-sm font-semibold text-slate-900">Attendance Number: {attendanceNumber}</p>
            <div className="flex justify-center">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <QRCodeSVG value={qrPayload} size={160} />
              </div>
            </div>
          </div>
        ) : null}

        <div>
          <button
            type="submit"
            disabled={loading || loadingOptions}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Registering...' : 'Register Attendee'}
          </button>
        </div>
      </form>
    </section>
  )
}