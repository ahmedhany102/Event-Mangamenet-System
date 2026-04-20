import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'

type AttendanceChartProps = {
  checkedIn: number
  total: number
}

export default function AttendanceChart({ checkedIn, total }: AttendanceChartProps) {
  const safeTotal = Math.max(total, 0)
  const safeCheckedIn = Math.max(checkedIn, 0)
  const notCheckedIn = Math.max(safeTotal - safeCheckedIn, 0)
  const percentage = safeTotal > 0 ? (safeCheckedIn / safeTotal) * 100 : 0

  const data = [
    { name: 'Checked In', value: safeCheckedIn, color: '#0f766e' },
    { name: 'Not Checked In', value: notCheckedIn, color: '#cbd5e1' },
  ]

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Attendance Rate</h2>
        <p className="text-sm text-slate-600">(checked-in / total tickets) x 100</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-center">
        <div className="mx-auto h-[220px] w-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={95}
                stroke="none"
              >
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-4xl font-bold tracking-tight text-slate-900">{percentage.toFixed(1)}%</p>
          <p className="mt-1 text-sm text-slate-600">
            {safeCheckedIn} checked in out of {safeTotal} tickets
          </p>

          <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.min(percentage, 100)}%` }} />
          </div>

          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Checked In
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-300" /> Not Checked In
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}