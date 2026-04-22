import { Html5Qrcode } from 'html5-qrcode'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { checkInByEvent } from '../../lib/checkInService'
import { supabase } from '../../lib/supabase'

type EventRow = {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  venue: string | null
  status: string
  vip_code: string | null
  speaker_code: string | null
}

type EventAttendeeDbRow = {
  attendee_id: number
  attendance_status: string
  checked_in_at: string | null
  ticket_code: string | null
  ticket_type: 'student' | 'vip' | 'speaker' | string | null
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
  ticketType: 'student' | 'vip' | 'speaker'
}

type ToastItem = {
  id: number
  type: 'success' | 'error'
  message: string
}

type Props = {
  eventId: number
  onBack: () => void
  onDataChanged?: () => Promise<void> | void
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

function normalizeTicketType(value: string | null): 'student' | 'vip' | 'speaker' {
  if (value === 'vip' || value === 'speaker') return value
  return 'student'
}

function toHourBucket(value: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const hour = String(date.getHours()).padStart(2, '0')
  return `${hour}:00`
}

export default function AdminEventControlPanel({ eventId, onBack, onDataChanged }: Props) {
  const [event, setEvent] = useState<EventRow | null>(null)
  const [attendeeRows, setAttendeeRows] = useState<AttendeeViewRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vipCodeInput, setVipCodeInput] = useState('')
  const [speakerCodeInput, setSpeakerCodeInput] = useState('')
  const [codesSaving, setCodesSaving] = useState(false)

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

    const [
      { data: eventData, error: eventError },
      { data: registrationsData, error: registrationsError },
      { data: ticketsData, error: ticketsError },
    ] = await Promise.all([
      supabase
        .from('events')
        .select('id,name,description,start_date,end_date,venue,status,vip_code,speaker_code')
        .eq('id', eventId)
        .single(),
      supabase
        .from('event_attendees')
        .select('attendee_id,attendance_status,checked_in_at,ticket_code,ticket_type')
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
        const status: AttendeeViewRow['status'] =
          registration.attendance_status === 'attended' ? 'attended' : 'registered'

        return {
          attendeeId: registration.attendee_id,
          fullName: attendee?.full_name ?? `Attendee ${registration.attendee_id}`,
          email: attendee?.email ?? '-',
          phone: attendee?.phone ?? null,
          status,
          checkInTime: registration.checked_in_at,
          ticketCode: registration.ticket_code ?? ticket?.ticket_code ?? null,
          ticketType: normalizeTicketType(registration.ticket_type),
        }
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName))

    setEvent(eventRecord)
    setVipCodeInput(eventRecord.vip_code ?? '')
    setSpeakerCodeInput(eventRecord.speaker_code ?? '')
    setAttendeeRows(rows)
    setLoading(false)
  }, [eventId])

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

        if (onDataChanged) {
          await onDataChanged()
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
    [event, loadEventData, onDataChanged, pushToast],
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
          // Ignore per-frame decode errors.
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
            try {
              activeScanner.clear()
            } catch {
              // Ignore cleanup errors.
            }
          })
      }
    }
  }, [scannerOpen, runCheckIn])

  const totalRegistered = attendeeRows.length
  const registeredRows = useMemo(() => attendeeRows.filter((row) => row.status === 'registered'), [attendeeRows])
  const attendedRows = useMemo(() => attendeeRows.filter((row) => row.status === 'attended'), [attendeeRows])
  const totalAttended = attendedRows.length
  const attendanceRate = totalRegistered > 0 ? (totalAttended * 100) / totalRegistered : 0
  const noShowCount = totalRegistered - totalAttended
  const noShowRate = totalRegistered > 0 ? (noShowCount * 100) / totalRegistered : 0

  const peakCheckIn = useMemo(() => {
    const counts = new Map<string, number>()
    attendedRows.forEach((row) => {
      const bucket = toHourBucket(row.checkInTime)
      if (!bucket) return
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
    })

    let maxLabel = '-'
    let maxCount = 0
    counts.forEach((count, label) => {
      if (count > maxCount) {
        maxLabel = label
        maxCount = count
      }
    })

    return maxCount === 0 ? '-' : `${maxLabel} (${maxCount})`
  }, [attendedRows])

  function exportCsv() {
    const headers = ['Full Name', 'Email', 'Phone', 'Ticket Type', 'Attendance Status', 'Check-in Time']
    const lines = attendeeRows.map((row) => {
      const values = [
        row.fullName,
        row.email,
        row.phone ?? '',
        row.ticketType,
        row.status,
        row.checkInTime ?? '',
      ]

      return values
        .map((value) => {
          const escaped = String(value).replaceAll('"', '""')
          return `"${escaped}"`
        })
        .join(',')
    })

    const csv = [headers.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `event-${eventId}-attendees.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  function secureRandomChars(length: number) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const bytes = new Uint8Array(length)

    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < length; i += 1) {
        bytes[i] = Math.floor(Math.random() * 256)
      }
    }

    return Array.from(bytes, (byte) => chars[byte % chars.length]).join('')
  }

  function generateCode(prefix: 'VIP' | 'SPK') {
    return `${prefix}-${secureRandomChars(6)}`
  }

  async function saveAccessCodes(vipCode: string, speakerCode: string) {
    if (!event) {
      pushToast('error', 'Event not loaded')
      return
    }

    const normalizedVip = vipCode.trim().toUpperCase()
    const normalizedSpeaker = speakerCode.trim().toUpperCase()

    if (normalizedVip === (event.vip_code ?? '').toUpperCase() && normalizedSpeaker === (event.speaker_code ?? '').toUpperCase()) {
      return
    }

    if (!normalizedVip || !normalizedSpeaker) {
      pushToast('error', 'VIP and Speaker codes cannot be empty')
      return
    }

    setCodesSaving(true)

    const { error: updateError } = await supabase
      .from('events')
      .update({ vip_code: normalizedVip, speaker_code: normalizedSpeaker })
      .eq('id', event.id)

    if (updateError) {
      pushToast('error', updateError.message)
      setCodesSaving(false)
      return
    }

    setEvent((prev) =>
      prev
        ? {
            ...prev,
            vip_code: normalizedVip,
            speaker_code: normalizedSpeaker,
          }
        : prev,
    )
    setVipCodeInput(normalizedVip)
    setSpeakerCodeInput(normalizedSpeaker)
    setCodesSaving(false)
    pushToast('success', 'Access codes updated')
  }

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
    <section className="space-y-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Event Control</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
          >
            Back to Dashboard
          </button>
        </div>
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
                <h3 className="text-2xl font-semibold text-slate-900">{event.name}</h3>
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
                <dt className="text-xs uppercase tracking-wide text-slate-500">Venue</dt>
                <dd className="mt-1 font-medium text-slate-900">{event.venue || '-'}</dd>
              </div>
            </dl>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <label htmlFor="vip-code" className="mb-1 block font-medium">
                  VIP Access Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="vip-code"
                    type="text"
                    value={vipCodeInput}
                    onChange={(e) => setVipCodeInput(e.target.value.toUpperCase())}
                    onBlur={() => {
                      void saveAccessCodes(vipCodeInput, speakerCodeInput)
                    }}
                    className="w-full rounded-md border border-amber-200 bg-white px-3 py-2 font-mono text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setVipCodeInput(generateCode('VIP'))}
                    className="rounded-md border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-900">
                <label htmlFor="speaker-code" className="mb-1 block font-medium">
                  Speaker Access Code
                </label>
                <div className="flex gap-2">
                  <input
                    id="speaker-code"
                    type="text"
                    value={speakerCodeInput}
                    onChange={(e) => setSpeakerCodeInput(e.target.value.toUpperCase())}
                    onBlur={() => {
                      void saveAccessCodes(vipCodeInput, speakerCodeInput)
                    }}
                    className="w-full rounded-md border border-indigo-200 bg-white px-3 py-2 font-mono text-xs text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setSpeakerCodeInput(generateCode('SPK'))}
                    className="rounded-md border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-900"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                disabled={codesSaving}
                onClick={() => saveAccessCodes(vipCodeInput, speakerCodeInput)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {codesSaving ? 'Saving Codes...' : 'Save Codes'}
              </button>
            </div>
          </article>

          <section className="grid gap-4 md:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Registered</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totalRegistered}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-600">Attended</p>
              <p className="mt-2 text-3xl font-bold text-emerald-700">{totalAttended}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Attendance Rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{attendanceRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">No-show Rate</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{noShowRate.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Peak Check-in</p>
              <p className="mt-2 text-xl font-bold text-slate-900">{peakCheckIn}</p>
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
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Ticket Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Ticket Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {registeredRows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-4 text-slate-600">
                        No attendees pending check-in.
                      </td>
                    </tr>
                  ) : (
                    registeredRows.map((row) => (
                      <tr key={row.attendeeId} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-4 py-3 text-slate-700">{row.email}</td>
                        <td className="px-4 py-3 text-slate-700">{row.phone || '-'}</td>
                        <td className="px-4 py-3 text-slate-700 uppercase">{row.ticketType}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{row.ticketCode ?? '-'}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            Registered
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
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
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Ticket Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Ticket Code</th>
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Check-in Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-emerald-800">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-100">
                  {attendedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-4 text-slate-600">
                        No attended attendees yet.
                      </td>
                    </tr>
                  ) : (
                    attendedRows.map((row) => (
                      <tr key={`attended-${row.attendeeId}`} className="hover:bg-emerald-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-4 py-3 text-slate-700 uppercase">{row.ticketType}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{row.ticketCode ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(row.checkInTime)}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                            Attended
                          </span>
                        </td>
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
