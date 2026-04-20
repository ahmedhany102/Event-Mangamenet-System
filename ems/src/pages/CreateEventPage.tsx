import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type OrganizationOption = {
  id: number
  name: string
}

type FormState = {
  name: string
  description: string
  start_date: string
  end_date: string
  budget: string
  status: string
  organization_id: string
  venue_id: string
}

const initialForm: FormState = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  budget: '0',
  status: 'planned',
  organization_id: '',
  venue_id: '',
}

export default function CreateEventPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizations() {
      setLoadingOrganizations(true)

      const { data, error: queryError } = await supabase
        .from('organizations')
        .select('id,name')
        .order('id', { ascending: true })

      if (queryError) {
        setError(queryError.message)
        setOrganizations([])
      } else {
        setOrganizations((data as OrganizationOption[]) ?? [])
      }

      setLoadingOrganizations(false)
    }

    void fetchOrganizations()
  }, [])

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

    if (!form.organization_id) {
      return 'Please select an organization.'
    }

    if (!form.venue_id || Number(form.venue_id) <= 0) {
      return 'Venue ID is required.'
    }

    return null
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

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
      organization_id: Number(form.organization_id),
      venue_id: Number(form.venue_id),
    }

    const { error: insertError } = await supabase.from('events').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess('Event created successfully.')
    setForm(initialForm)
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Event</h1>
        <Link
          to="/events"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Events
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        {!loadingOrganizations && organizations.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p>Please create an organization first</p>
            <Link
              to="/organizations/create"
              className="mt-2 inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Create Organization
            </Link>
          </div>
        ) : null}

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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="organization_id" className="mb-1 block text-sm font-medium text-slate-700">
              Organization
            </label>
            <select
              id="organization_id"
              value={form.organization_id}
              onChange={(e) => updateField('organization_id', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
              disabled={loadingOrganizations || organizations.length === 0}
            >
              <option value="">Select organization</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={String(organization.id)}>
                  {organization.id} - {organization.name}
                </option>
              ))}
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
            disabled={loading || loadingOrganizations || organizations.length === 0}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </section>
  )
}