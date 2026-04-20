import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type OrganizationRow = {
  id: number
  name: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true)
      setError(null)

      const { data, error: queryError } = await supabase
        .from('organizations')
        .select('id,name')
        .order('id', { ascending: true })

      if (queryError) {
        setError(queryError.message)
        setOrganizations([])
      } else {
        setOrganizations((data as OrganizationRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchOrganizations()
  }, [])

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Organizations</h1>
          <p className="mt-2 text-sm text-slate-600">Manage organization records.</p>
        </div>
        <Link
          to="/organizations/create"
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
        >
          Create Organization
        </Link>
      </header>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          Loading organizations...
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load organizations: {error}
        </div>
      ) : null}

      {!loading && !error && organizations.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-600">
          No organizations found.
        </div>
      ) : null}

      {!loading && !error && organizations.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">ID</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {organizations.map((organization) => (
                <tr key={organization.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-900">{organization.id}</td>
                  <td className="px-4 py-3 text-slate-700">{organization.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}