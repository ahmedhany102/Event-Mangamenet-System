import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type OrganizationOption = {
  id: number
  name: string
}

type FormState = {
  full_name: string
  email: string
  job_title: string
  organization_id: string
}

const initialForm: FormState = {
  full_name: '',
  email: '',
  job_title: '',
  organization_id: '',
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function CreateEmployeePage() {
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
    if (!form.full_name.trim()) return 'Full name is required.'
    if (!form.email.trim()) return 'Email is required.'
    if (!isValidEmail(form.email.trim())) return 'Please enter a valid email address.'

    if (!form.organization_id) {
      return 'Please select an organization.'
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
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      job_title: form.job_title.trim() || null,
      organization_id: Number(form.organization_id),
    }

    const { error: insertError } = await supabase.from('employees').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess('Employee created successfully.')
    setForm(initialForm)
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Add Employee</h1>
        <Link
          to="/employees"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Employees
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
          <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
            Full Name
          </label>
          <input
            id="full_name"
            type="text"
            value={form.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="job_title" className="mb-1 block text-sm font-medium text-slate-700">
            Job Title
          </label>
          <input
            id="job_title"
            type="text"
            value={form.job_title}
            onChange={(e) => updateField('job_title', e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>

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

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
        {success ? <p className="text-sm font-medium text-emerald-700">{success}</p> : null}

        <div>
          <button
            type="submit"
            disabled={loading || loadingOrganizations || organizations.length === 0}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Employee'}
          </button>
        </div>
      </form>
    </section>
  )
}