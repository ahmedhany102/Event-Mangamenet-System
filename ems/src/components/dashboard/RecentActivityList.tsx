type RecentActivityItem = {
  id: string
  type: 'registration' | 'ticket' | 'checkin'
  title: string
  subtitle: string
  createdAt: string
}

type RecentActivityListProps = {
  items: RecentActivityItem[]
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

const TYPE_BADGE: Record<RecentActivityItem['type'], string> = {
  registration: 'bg-sky-100 text-sky-700',
  ticket: 'bg-amber-100 text-amber-800',
  checkin: 'bg-emerald-100 text-emerald-700',
}

export default function RecentActivityList({ items }: RecentActivityListProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        <p className="text-sm text-slate-600">Last 10 actions</p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No recent activity.
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{item.title}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${TYPE_BADGE[item.type]}`}>
                  {item.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{item.subtitle}</p>
              <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}