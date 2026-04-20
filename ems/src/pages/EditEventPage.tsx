import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type FormState = {
  name: string
  description: string
  start_date: string
  end_date: string
  budget: string
  status: string
  venue_id: string
}

type EventRow = {
  id: number
  venue_id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  budget: number
  status: string
}

const initialForm: FormState = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: '0',
  status: 'planned',
  venue_id: '',
}

export default function EditEventPage() {
  const { id } = useParams()

  const [form, setForm] = useState<FormState>(initialForm)
  const [initialLoading, setInitialLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEvent() {
      setInitialLoading(true)
      setError(null)

      if (!id) {
        setError('Event id is missing.')
        setInitialLoading(false)
        return
      }

      const eventId = Number(id)
      if (Number.isNaN(eventId)) {
        setError('Invalid event id.')
        setInitialLoading(false)
        return
      }

      const { data, error: eventError } = await supabase.from('events').select('*').eq('id', eventId).single()

      if (eventError) {
        setError(eventError.message)
      } else {
        const event = data as EventRow
        setForm({
          name: event.name,
          description: event.description ?? '',
          start_date: event.start_date,
          end_date: event.end_date,
          budget: String(event.budget ?? 0),
          status: event.status,
          venue_id: String(event.venue_id),
        })
      }

      setInitialLoading(false)
    }

    void fetchEvent()
  }, [id])

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    if (!form.name.trim()) return 'Name is required.'
    if (!form.start_date || !form.end_date) return 'Start date and end date are required.'
    if (new Date(form.start_date) >= new Date(form.end_date)) {
      return 'Start date must be before end date.'
    }

    const budget = Number(form.budget)
    if (Number.isNaN(budget) || budget < 0) return 'Budget must be greater than or equal to 0.'

    if (!form.venue_id || Number(form.venue_id) <= 0) {
      return 'Venue ID is required.'
    }

    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!id) {
      setError('Event id is missing.')
      return
    }

    const eventId = Number(id)
    if (Number.isNaN(eventId)) {
      setError('Invalid event id.')
      return
    }

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date,
      end_date: form.end_date,
      budget: Number(form.budget),
      status: form.status,
      venue_id: Number(form.venue_id),
    }

    const { error: updateError } = await supabase.from('events').update(payload).eq('id', eventId)

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess('Event updated successfully.')
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Edit Event</h1>
        <Link
          to="/admin/events"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back
        </Link>
      </div>

      {initialLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">Loading event...</div>
      ) : null}

      {!initialLoading ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-slate-700">
                Start Date
              </label>
              <input
                id="start_date"
                type="date"
                value={form.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-slate-700">
                End Date
              </label>
              <input
                id="end_date"
                type="date"
                value={form.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="budget" className="mb-1 block text-sm font-medium text-slate-700">
                Budget
              </label>
              <input
                id="budget"
                type="number"
                min="0"
                step="0.01"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              >
                <option value="planned">planned</option>
                <option value="active">active</option>
                <option value="completed">completed</option>
                <option value="cancelled">cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="venue_id" className="mb-1 block text-sm font-medium text-slate-700">
                Venue ID
              </label>
              <input
                id="venue_id"
                type="number"
                min="1"
                value={form.venue_id}
                onChange={(e) => updateField('venue_id', e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
          {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Update Event'}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}
