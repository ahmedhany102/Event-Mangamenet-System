import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type FormState = {
  title: string
  description: string
  start_date: string
  deadline: string
  status: string
  event_id: string
  employee_id: string
}

const initialForm: FormState = {
  title: '',
  description: '',
  start_date: '',
  deadline: '',
  status: 'todo',
  event_id: '',
  employee_id: '',
}

export default function CreateTaskPage() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function validate() {
    if (!form.title.trim()) return 'Title is required.'

    if (form.start_date && form.deadline) {
      if (new Date(form.deadline) < new Date(form.start_date)) {
        return 'Deadline must be greater than or equal to start date.'
      }
    }

    if (!form.event_id || Number(form.event_id) <= 0) {
      return 'Event ID is required.'
    }

    if (form.employee_id && Number(form.employee_id) <= 0) {
      return 'Employee ID must be a valid positive number.'
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
      title: form.title.trim(),
      description: form.description.trim() || null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      status: form.status,
      event_id: Number(form.event_id),
      employee_id: form.employee_id ? Number(form.employee_id) : null,
    }

    const { error: insertError } = await supabase.from('tasks').insert(payload)

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setSuccess('Task created successfully.')
    setForm(initialForm)
    setLoading(false)
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create Task</h1>
        <Link
          to="/tasks"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800"
        >
          Back to Tasks
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
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
            />
          </div>

          <div>
            <label htmlFor="deadline" className="mb-1 block text-sm font-medium text-slate-700">
              Deadline
            </label>
            <input
              id="deadline"
              type="date"
              value={form.deadline}
              onChange={(e) => updateField('deadline', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
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
            <option value="todo">todo</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="event_id" className="mb-1 block text-sm font-medium text-slate-700">
              Event ID
            </label>
            <input
              id="event_id"
              type="number"
              min="1"
              value={form.event_id}
              onChange={(e) => updateField('event_id', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="employee_id" className="mb-1 block text-sm font-medium text-slate-700">
              Employee ID (optional)
            </label>
            <input
              id="employee_id"
              type="number"
              min="1"
              value={form.employee_id}
              onChange={(e) => updateField('employee_id', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
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
            {loading ? 'Saving...' : 'Save Task'}
          </button>
        </div>
      </form>
    </section>
  )
}