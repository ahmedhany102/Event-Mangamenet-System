import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

type TicketRow = {
  id: number
  event_id: number
  attendee_id: number
  ticket_code: string
  is_checked_in: boolean
}

function parseTicketInput(input: string) {
  const trimmed = input.trim()

  if (!trimmed) {
    return { type: 'invalid' as const, value: '' }
  }

  if (trimmed.startsWith('EMS|')) {
    const parts = trimmed.split('|')
    const ticketCode = parts[1]?.trim() ?? ''
    if (ticketCode) {
      return { type: 'ticket_code' as const, value: ticketCode }
    }
  }

  const attendanceMatch = trimmed.match(/^ATT-(\d+)$/i)
  if (attendanceMatch?.[1]) {
    return { type: 'ticket_id' as const, value: String(Number(attendanceMatch[1])) }
  }

  return { type: 'ticket_code' as const, value: trimmed }
}

export default function CheckInPage() {
  const [ticketInput, setTicketInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const parsedInput = parseTicketInput(ticketInput)
    if (parsedInput.type === 'invalid') {
      setError('Ticket code or QR payload is required')
      return
    }

    setLoading(true)

    const ticketLookupQuery = supabase.from('tickets').select('*')
    const { data, error: fetchError } =
      parsedInput.type === 'ticket_id'
        ? await ticketLookupQuery.eq('id', Number(parsedInput.value)).single()
        : await ticketLookupQuery.eq('ticket_code', parsedInput.value).single()

    if (fetchError) {
      const notFound = fetchError.code === 'PGRST116'
      setError(notFound ? 'Invalid ticket' : fetchError.message)
      setLoading(false)
      return
    }

    const ticket = data as TicketRow

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
    setTicketInput('')
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">Check-In</h1>
      <p className="mt-2 text-sm text-slate-600">Scan QR payload, ticket code, or attendance number to record attendance.</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="ticket_input" className="mb-1 block text-sm font-medium text-slate-700">
            Ticket Code / Attendance Number / QR Payload
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
            disabled={loading}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Checking...' : 'Check In'}
          </button>
        </div>
      </form>
    </section>
  )
}