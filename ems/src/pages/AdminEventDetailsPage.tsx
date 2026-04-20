import { Html5Qrcode } from 'html5-qrcode'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { checkInByEvent } from '../lib/checkInService'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  budget: number
  venue_id: number
  status: string
}

type EventAttendeeDbRow = {
  attendee_id: number
  attendance_status: string
  checked_in_at: string | null
}

type AttendeeDbRow = {
  id: number
  full_name: string
  email: string
  phone: string | null
}

type TicketDbRow = {
  attendee_id: number
  ticket_code: string
}

type AttendeeViewRow = {
  attendeeId: number
  fullName: string
  email: string
  phone: string | null
  status: 'registered' | 'attended'
  checkInTime: string | null
  ticketCode: string | null
}

type ToastItem = {
  id: number
  type: 'success' | 'error'
  message: string
}

const scannerRegionId = 'admin-event-qr-reader'

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatDateTime(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

function formatBudget(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

export default function AdminEventDetailsPage() {
  const { id } = useParams()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [attendeeRows, setAttendeeRows] = useState<AttendeeViewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [checkInInput, setCheckInInput] = useState('')
  const [checkInLoading, setCheckInLoading] = useState(false)

  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(1)

  const pushToast = useCallback((type: ToastItem['type'], message: string) => {
    const id = toastIdRef.current
    toastIdRef.current += 1

    setToasts((prev) => [...prev, { id, type, message }])

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 3500)
  }, [])

  const loadEventData = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!id) {
      setError('Event id is missing.')
      setLoading(false)
      return
    }

    const eventId = Number(id)
    if (Number.isNaN(eventId)) {
      setError('Invalid event id.')
      setLoading(false)
      return
    }

    const [
      { data: eventData, error: eventError },
      { data: registrationsData, error: registrationsError },
      { data: ticketsData, error: ticketsError },
    ] = await Promise.all([
      supabase.from('events').select('id,name,description,start_date,end_date,budget,venue_id,status').eq('id', eventId).single(),
      supabase
        .from('event_attendees')
        .select('attendee_id,attendance_status,checked_in_at')
        .eq('event_id', eventId),
      supabase.from('tickets').select('attendee_id,ticket_code').eq('event_id', eventId),
    ])

    const firstError = eventError || registrationsError || ticketsError

    if (firstError) {
      setError(firstError.message)
      setEvent(null)
      setAttendeeRows([])
      setLoading(false)
      return
    }

    const eventRecord = eventData as EventRow
    const registrations = (registrationsData as EventAttendeeDbRow[]) ?? []
    const tickets = (ticketsData as TicketDbRow[]) ?? []

    const attendeeIds = [...new Set(registrations.map((row) => row.attendee_id))]
    let attendees: AttendeeDbRow[] = []

    if (attendeeIds.length > 0) {
      const { data: attendeeData, error: attendeesError } = await supabase
        .from('attendees')
        .select('id,full_name,email,phone')
        .in('id', attendeeIds)

      if (attendeesError) {
        setError(attendeesError.message)
        setEvent(eventRecord)
        setAttendeeRows([])
        setLoading(false)
        return
      }

      attendees = (attendeeData as AttendeeDbRow[]) ?? []
    }

    const attendeeById = new Map(attendees.map((attendee) => [attendee.id, attendee]))
    const ticketByAttendeeId = new Map(tickets.map((ticket) => [ticket.attendee_id, ticket]))

    const rows: AttendeeViewRow[] = registrations
      .map((registration) => {
        const attendee = attendeeById.get(registration.attendee_id)
        const ticket = ticketByAttendeeId.get(registration.attendee_id)

        return {
          attendeeId: registration.attendee_id,
          fullName: attendee?.full_name ?? `Attendee ${registration.attendee_id}`,
          email: attendee?.email ?? '-',
          phone: attendee?.phone ?? null,
          status: registration.attendance_status === 'attended' ? 'attended' : 'registered',
          checkInTime: registration.checked_in_at,
          ticketCode: ticket?.ticket_code ?? null,
        }
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))

    setEvent(eventRecord)
    setAttendeeRows(rows)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void loadEventData()
  }, [loadEventData])

  const runCheckIn = useCallback(
    async (rawInput: string) => {
      if (!event) {
        pushToast('error', 'Event not loaded')
        return
      }

      setCheckInLoading(true)

      try {
        const result = await checkInByEvent({
          selectedEventId: event.id,
          rawInput,
        })

        let found = false
        setAttendeeRows((prev) =>
          prev.map((row) => {
            if (row.attendeeId !== result.attendeeId) return row
            found = true
            return {
              ...row,
              status: 'attended',
              checkInTime: result.checkedInAt,
            }
          }),
        )

        if (!found) {
          await loadEventData()
        }

        pushToast('success', 'Check-in successful')
        setCheckInInput('')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Check-in failed'
        pushToast('error', message)
      } finally {
        setCheckInLoading(false)
      }
    },
    [event, loadEventData, pushToast],
  )

  useEffect(() => {
    if (!scannerOpen) {
      return
    }

    let disposed = false
    setScannerError(null)

    const scanner = new Html5Qrcode(scannerRegionId)
    scannerRef.current = scanner

    void scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          if (disposed) return
          setScannerOpen(false)
          setCheckInInput(decodedText)
          void runCheckIn(decodedText)
        },
        () => {
          // Ignore per-frame decode errors
        },
      )
      .catch(() => {
        if (disposed) return
        setScannerError('Could not access camera. Please allow camera permission and try again.')
      })

    return () => {
      disposed = true
      const activeScanner = scannerRef.current
      scannerRef.current = null

      if (activeScanner) {
        void activeScanner
          .stop()
          .catch(() => undefined)
          .finally(() => {
            void activeScanner.clear().catch(() => undefined)
          })
      }
    }
  }, [scannerOpen, runCheckIn])

  const totalRegistered = attendeeRows.length
  const attendedRows = useMemo(() => attendeeRows.filter((row) => row.status === 'attended'), [attendeeRows])
  const totalAttended = attendedRows.length
  const attendanceRate = totalRegistered > 0 ? (totalAttended * 100) / totalRegistered : 0

  async function handleManualCheckIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const rawValue = checkInInput.trim()
    if (!rawValue) {
      pushToast('error', 'Ticket code or QR payload is required')
      return
    }

    await runCheckIn(rawValue)
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Event Details</h1>
        <Link
          to="/admin/events"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Events
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading event details...</div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      {!loading && !error && event ? (
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

            <dl className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-4">
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

          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total Registered</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalRegistered}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">Total Attended</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{totalAttended}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Attendance Rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{attendanceRate.toFixed(1)}%</p>
            </div>
          </section>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Check-In</h3>
            <p className="mt-2 text-sm text-slate-600">Enter ticket code or scan QR to validate and mark attendance.</p>

            <form onSubmit={handleManualCheckIn} className="mt-4 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={checkInInput}
                onChange={(e) => setCheckInInput(e.target.value)}
                placeholder='Ticket code or QR payload JSON, e.g. {"ticket_code":"...","event_id":1}'
                className="min-w-[280px] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={checkInLoading}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkInLoading ? 'Checking...' : 'Check In'}
              </button>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                disabled={checkInLoading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Scan QR
              </button>
            </form>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Registered Attendees</h3>
            <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {attendeeRows.map((row) => (
                    <tr key={row.attendeeId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                      <td className="px-4 py-3 text-slate-700">{row.email}</td>
                      <td className="px-4 py-3 text-slate-700">{row.phone || '-'}</td>
                      <td className="px-4 py-3">
                        {row.status === 'attended' ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Attended
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            Registered
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Attended</h3>
            <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-200">
              <table className="min-w-full divide-y divide-emerald-200 text-sm">
                <thead className="bg-emerald-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Check-in Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {attendedRows.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-slate-600">
                        No attended attendees yet.
                      </td>
                    </tr>
                  ) : (
                    attendedRows.map((row) => (
                      <tr key={`attended-${row.attendeeId}`} className="hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(row.checkInTime)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      ) : null}

      {scannerOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Scan QR Ticket</h4>
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
              >
                Close
              </button>
            </div>

            {scannerError ? <p className="mb-3 text-sm text-rose-700">{scannerError}</p> : null}

            <div id={scannerRegionId} className="min-h-[280px] overflow-hidden rounded-lg border border-slate-200" />
          </div>
        </div>
      ) : null}

      <div className="fixed right-5 top-20 z-[60] space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[240px] rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </section>
  )
}
