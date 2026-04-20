type EventSummaryRow = {
  eventId: number
  eventName: string
  organizationName: string
  registered: number
  attended: number
  attendanceRate: number
}

type EventsTableProps = {
  rows: EventSummaryRow[]
}

export default function EventsTable({ rows }: EventsTableProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Events Summary</h2>
        <p className="text-sm text-slate-600">Registrations and attendance by event</p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No events available for summary.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Event Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Organization</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Registered</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Attended</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Attendance Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row) => (
                <tr key={row.eventId} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{row.eventName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.organizationName}</td>
                  <td className="px-4 py-3 text-slate-700">{row.registered}</td>
                  <td className="px-4 py-3 text-slate-700">{row.attended}</td>
                  <td className="px-4 py-3 text-slate-700">{row.attendanceRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  )
}