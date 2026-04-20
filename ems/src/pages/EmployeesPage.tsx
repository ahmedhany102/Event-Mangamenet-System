import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type EmployeeRow = {
  id: number
  full_name: string
  email: string
  job_title: string | null
  organization_id: number
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchEmployees() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase.from('employees').select('*')

      if (queryError) {
        setError(queryError.message)
        setEmployees([])
      } else {
        setEmployees((data as EmployeeRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchEmployees()
  }, [])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Employees</h1>
          <p className="mt-2 text-sm text-slate-600">Manage employee records.</p>
        </div>
        <Link
          to="/employees/create"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Add Employee
        </Link>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading employees...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load employees: {error}
        </div>
      ) : null}

      {!loading && !error && employees.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No employees found.
        </div>
      ) : null}

      {!loading && !error && employees.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Full Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Job Title</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Organization ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{employee.full_name}</td>
                  <td className="px-4 py-3 text-slate-700">{employee.email}</td>
                  <td className="px-4 py-3 text-slate-700">{employee.job_title || '-'}</td>
                  <td className="px-4 py-3 text-slate-700">{employee.organization_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}