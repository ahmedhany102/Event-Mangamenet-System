import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type TaskStatusRow = {
  status: string
  count: number
}

type TasksChartProps = {
  rows: TaskStatusRow[]
  totalTasks: number
}

const STATUS_COLORS: Record<string, string> = {
  todo: '#0f172a',
  in_progress: '#ea580c',
  done: '#15803d',
}

export default function TasksChart({ rows, totalTasks }: TasksChartProps) {
  const chartData = rows.map((row) => ({
    ...row,
    color: STATUS_COLORS[row.status] ?? '#64748b',
  }))

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Tasks Overview</h2>
        <p className="text-sm text-slate-600">Total tasks: {totalTasks}</p>
      </div>

      {chartData.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No tasks available.
        </div>
      ) : (
        <>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  innerRadius={45}
                  stroke="none"
                >
                  {chartData.map((row) => (
                    <Cell key={row.status} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const safeValue = typeof value === 'number' ? value : Number(value ?? 0)
                    const safeName = String(name ?? '').replace('_', ' ')
                    return [safeValue, safeName]
                  }}
                  contentStyle={{ borderRadius: '12px', borderColor: '#cbd5e1' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid gap-2 text-sm text-slate-700">
            {chartData.map((row) => (
              <div key={row.status} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.status}
                </span>
                <span className="font-semibold">{row.count}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </article>
  )
}