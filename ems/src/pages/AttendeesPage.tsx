import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type AttendeeRow = {
  id: number
  full_name: string
  email: string
  phone: string | null
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAttendees() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase.from('attendees').select('*')

      if (queryError) {
        setError(queryError.message)
        setAttendees([])
      } else {
        setAttendees((data as AttendeeRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchAttendees()
  }, [])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Attendees</h1>
          <p className="mt-2 text-sm text-slate-600">View attendee records and registration participants.</p>
        </div>
        <Link
          to="/admin/attendees/create"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Attendee
        </Link>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading attendees...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load attendees: {error}
        </div>
      ) : null}

      {!loading && !error && attendees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No attendees found.
        </div>
      ) : null}

      {!loading && !error && attendees.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {attendees.map((attendee) => (
                <tr key={attendee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{attendee.full_name}</td>
                  <td className="px-4 py-3 text-slate-700">{attendee.email}</td>
                  <td className="px-4 py-3 text-slate-700">{attendee.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}