import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
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

type RegistrationFormState = {
  full_name: string
  email: string
  phone: string
}

type RegistrationResult = {
  ticketCode: string
  attendanceNumber: string
  qrPayload: string
}

const initialRegistrationForm: RegistrationFormState = {
  full_name: '',
  email: '',
  phone: '',
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

  const [event, setEvent] = useState<EventRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventError, setEventError] = useState<string | null>(null)

  const [registrationForm, setRegistrationForm] = useState<RegistrationFormState>(initialRegistrationForm)
  const [registrationLoading, setRegistrationLoading] = useState(false)
  const [registrationError, setRegistrationError] = useState<string | null>(null)
  const [registrationSuccess, setRegistrationSuccess] = useState<string | null>(null)
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      if (!id) {
        setEventError('Event id is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setEventError(null)

      const eventId = Number(id)
      if (Number.isNaN(eventId)) {
        setEventError('Invalid event id.')
        setLoading(false)
        return
      }

      const { data, error: queryError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single()

      if (queryError) {
        setEventError(queryError.message)
        setEvent(null)
      } else {
        setEvent(data as EventRow)
      }

      setLoading(false)
    }

    void fetchEvent()
  }, [id])

  function updateRegistrationField<K extends keyof RegistrationFormState>(
    key: K,
    value: RegistrationFormState[K],
  ) {
    setRegistrationForm((prev) => ({ ...prev, [key]: value }))
  }

  function generateTicketCode() {
    const randomPart =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`

    return `TKT-${randomPart}`
  }

  function validateRegistrationForm() {
    if (!registrationForm.full_name.trim()) return 'Full name is required.'
    if (!registrationForm.email.trim()) return 'Email is required.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationForm.email.trim())) {
      return 'Please enter a valid email address.'
    }
    return null
  }

  async function handleRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setRegistrationError(null)
    setRegistrationSuccess(null)
    setRegistrationResult(null)

    if (!event) {
      setRegistrationError('Event is not loaded.')
      return
    }

    const eventId = event.id

    const validationError = validateRegistrationForm()
    if (validationError) {
      setRegistrationError(validationError)
      return
    }

    setRegistrationLoading(true)

    const normalizedEmail = registrationForm.email.trim().toLowerCase()

    const { data: existingAttendee, error: existingAttendeeError } = await supabase
      .from('attendees')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existingAttendeeError) {
      setRegistrationError(existingAttendeeError.message)
      setRegistrationLoading(false)
      return
    }

    let attendeeId: number | null = existingAttendee?.id ?? null

    if (!attendeeId) {
      const { data: insertedAttendee, error: attendeeInsertError } = await supabase
        .from('attendees')
        .insert({
          full_name: registrationForm.full_name.trim(),
          email: normalizedEmail,
          phone: registrationForm.phone.trim() || null,
        })
        .select('id')
        .single()

      if (attendeeInsertError || !insertedAttendee) {
        setRegistrationError(attendeeInsertError?.message ?? 'Could not create attendee record.')
        setRegistrationLoading(false)
        return
      }

      attendeeId = insertedAttendee.id
    }

    const { data: existingRegistration, error: existingRegistrationError } = await supabase
      .from('event_attendees')
      .select('event_id,attendee_id')
      .eq('event_id', eventId)
      .eq('attendee_id', attendeeId)
      .maybeSingle()

    if (existingRegistrationError) {
      setRegistrationError(existingRegistrationError.message)
      setRegistrationLoading(false)
      return
    }

    if (existingRegistration) {
      setRegistrationError('This attendee is already registered for this event.')
      setRegistrationLoading(false)
      return
    }

    const { error: registrationInsertError } = await supabase.from('event_attendees').insert({
      event_id: eventId,
      attendee_id: attendeeId,
      attendance_status: 'registered',
    })

    if (registrationInsertError) {
      setRegistrationError(registrationInsertError.message)
      setRegistrationLoading(false)
      return
    }

    async function rollbackRegistration() {
      await supabase.from('event_attendees').delete().eq('event_id', eventId).eq('attendee_id', attendeeId)
    }

    let createdTicket:
      | {
          id: number
          ticket_code: string
          event_id: number
          attendee_id: number
        }
      | null = null

    for (let i = 0; i < 5; i += 1) {
      const code = generateTicketCode()
      const { data: ticketData, error: ticketInsertError } = await supabase
        .from('tickets')
        .insert({
          event_id: eventId,
          attendee_id: attendeeId,
          ticket_code: code,
        })
        .select('id,ticket_code,event_id,attendee_id')
        .single()

      if (!ticketInsertError && ticketData) {
        createdTicket = ticketData
        break
      }

      const errorMessage = ticketInsertError?.message.toLowerCase() ?? ''
      const codeConflict = errorMessage.includes('ticket_code')

      if (codeConflict) {
        continue
      }

      await rollbackRegistration()
      setRegistrationError(ticketInsertError?.message ?? 'Could not generate ticket.')
      setRegistrationLoading(false)
      return
    }

    if (!createdTicket) {
      await rollbackRegistration()
      setRegistrationError('Could not generate a unique ticket code. Please try again.')
      setRegistrationLoading(false)
      return
    }

    const attendanceNumber = `ATT-${String(createdTicket.id).padStart(6, '0')}`
    const qrPayload = JSON.stringify({
      ticket_code: createdTicket.ticket_code,
      event_id: createdTicket.event_id,
    })

    setRegistrationSuccess('Registration successful. Keep your QR code and attendance number for event entry.')
    setRegistrationResult({
      ticketCode: createdTicket.ticket_code,
      attendanceNumber,
      qrPayload,
    })
    setRegistrationForm(initialRegistrationForm)
    setRegistrationLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Event Details</h1>
        <Link
          to="/"
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

      {!loading && eventError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{eventError}</div>
      ) : null}

      {!loading && !eventError && !event ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Event not found.
        </div>
      ) : null}

      {!loading && !eventError && event ? (
        <div className="space-y-6">
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
                <dt className="text-xs uppercase tracking-wide text-slate-500">Venue</dt>
                <dd className="mt-1 font-medium text-slate-900">#{event.venue_id}</dd>
              </div>
            </dl>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Register For This Event</h3>
            <p className="mt-2 text-sm text-slate-600">
              Complete registration to receive your ticket code, attendance number, and QR pass.
            </p>

            <form onSubmit={handleRegister} className="mt-5 space-y-4">
              <div>
                <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  value={registrationForm.full_name}
                  onChange={(e) => updateRegistrationField('full_name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={registrationForm.email}
                    onChange={(e) => updateRegistrationField('email', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="text"
                    value={registrationForm.phone}
                    onChange={(e) => updateRegistrationField('phone', e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                  />
                </div>
              </div>

              {registrationError ? <p className="text-sm font-medium text-rose-700">{registrationError}</p> : null}
              {registrationSuccess ? (
                <p className="text-sm font-medium text-emerald-700">{registrationSuccess}</p>
              ) : null}

              {registrationResult ? (
                <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">Ticket Code: {registrationResult.ticketCode}</p>
                  <p className="text-sm font-semibold text-slate-900">
                    Attendance Number: {registrationResult.attendanceNumber}
                  </p>
                  <div className="flex justify-center">
                    <div className="rounded-lg border border-slate-200 bg-white p-3">
                      <QRCodeSVG value={registrationResult.qrPayload} size={170} />
                    </div>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={registrationLoading}
                className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {registrationLoading ? 'Registering...' : 'Register'}
              </button>
            </form>
          </article>
        </div>
      ) : null}
    </section>
  )
}