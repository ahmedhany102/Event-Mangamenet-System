import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type TaskRow = {
  id: number
  title: string
  status: string
  start_date: string | null
  deadline: string | null
  event_id: number
  employee_id: number | null
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase.from('tasks').select('*')

      if (queryError) {
        setError(queryError.message)
        setTasks([])
      } else {
        setTasks((data as TaskRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchTasks()
  }, [])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tasks</h1>
          <p className="mt-2 text-sm text-slate-600">Track and manage tasks across events.</p>
        </div>
        <Link
          to="/tasks/create"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Task
        </Link>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading tasks...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load tasks: {error}
        </div>
      ) : null}

      {!loading && !error && tasks.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No tasks found.
        </div>
      ) : null}

      {!loading && !error && tasks.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Start Date</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Deadline</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Event ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Employee ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{task.title}</td>
                  <td className="px-4 py-3 text-slate-700">{task.status}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(task.start_date)}</td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(task.deadline)}</td>
                  <td className="px-4 py-3 text-slate-700">{task.event_id}</td>
                  <td className="px-4 py-3 text-slate-700">{task.employee_id ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}