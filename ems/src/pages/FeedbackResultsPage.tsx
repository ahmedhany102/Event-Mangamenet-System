import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
}

type FeedbackRow = {
  id: number
  attendee_id: number
  rating: number
  comment: string | null
  created_at: string
}

type AttendeeRow = {
  id: number
  full_name: string
  email: string
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function FeedbackResultsPage() {
  const { eventId } = useParams<{ eventId: string }>()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([])
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!eventId) {
      setError('Event ID is missing.')
      setLoading(false)
      return
    }

    const eventNum = Number(eventId)
    if (Number.isNaN(eventNum)) {
      setError('Invalid event ID.')
      setLoading(false)
      return
    }

    const [
      { data: eventData, error: eventError },
      { data: feedbackData, error: feedbackError },
    ] = await Promise.all([
      supabase.from('events').select('id, name').eq('id', eventNum).single(),
      supabase
        .from('feedback')
        .select('id, attendee_id, rating, comment, created_at')
        .eq('event_id', eventNum)
        .order('created_at', { ascending: false }),
    ])

    if (eventError) {
      setError(eventError.message)
      setLoading(false)
      return
    }

    if (feedbackError) {
      setError(feedbackError.message)
      setLoading(false)
      return
    }

    const feedbackList = (feedbackData as FeedbackRow[]) ?? []
    setFeedbackRows(feedbackList)
    setEvent(eventData as EventRow)

    const attendeeIds = [...new Set(feedbackList.map((f) => f.attendee_id))]
    if (attendeeIds.length > 0) {
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('attendees')
        .select('id, full_name, email')
        .in('id', attendeeIds)

      if (attendeeError) {
        setError(attendeeError.message)
      } else {
        setAttendees((attendeeData as AttendeeRow[]) ?? [])
      }
    }

    setLoading(false)
  }, [eventId])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const attendeeById = useMemo(() => {
    const map = new Map<number, AttendeeRow>()
    attendees.forEach((a) => map.set(a.id, a))
    return map
  }, [attendees])

  const avgRating = useMemo(() => {
    if (feedbackRows.length === 0) return null
    const sum = feedbackRows.reduce((acc, row) => acc + row.rating, 0)
    return sum / feedbackRows.length
  }, [feedbackRows])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {loading ? 'Loading...' : event?.name ?? 'Feedback Results'}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Feedback submissions and ratings for this event.
          </p>
        </div>
        <Link
          to="/admin"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading feedback data...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">{error}</div>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Average Rating</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {avgRating !== null ? `\u2B50 ${avgRating.toFixed(1)} / 5` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Total Feedback</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{feedbackRows.length}</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Rating</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Comment</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {feedbackRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-slate-600">
                      No feedback submissions yet.
                    </td>
                  </tr>
                ) : (
                  feedbackRows.map((row) => {
                    const attendee = attendeeById.get(row.attendee_id)
                    return (
                      <tr key={row.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {attendee?.full_name ?? `Attendee ${row.attendee_id}`}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{attendee?.email ?? '-'}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {'\u2B50'.repeat(row.rating)}
                          {'\u2606'.repeat(5 - row.rating)}
                          <span className="ml-1 text-xs text-slate-500">({row.rating}/5)</span>
                        </td>
                        <td className="max-w-xs px-4 py-3 text-slate-700">
                          {row.comment || <span className="text-slate-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatDateTime(row.created_at)}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  )
}