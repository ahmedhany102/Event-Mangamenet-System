import { Link } from 'react-router-dom'

type EventItem = {
  id: number
  name: string
  start_date: string
  end_date: string
  status: string
  budget: number
}

type EventCardProps = {
  event: EventItem
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function formatBudget(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value ?? 0)
}

function statusStyles(status: string) {
  if (status === 'active') return 'bg-emerald-100 text-emerald-800'
  if (status === 'planned') return 'bg-blue-100 text-blue-800'
  if (status === 'completed') return 'bg-slate-200 text-slate-800'
  if (status === 'cancelled') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <Link to={`/events/${event.id}`} className="block transition hover:-translate-y-0.5 hover:shadow-md">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{event.name}</h3>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(event.status)}`}
          >
            {event.status}
          </span>
        </div>

        <dl className="mt-4 grid gap-2 text-sm text-slate-600">
          <div className="flex items-center justify-between">
            <dt>Start Date</dt>
            <dd className="font-medium text-slate-800">{formatDate(event.start_date)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>End Date</dt>
            <dd className="font-medium text-slate-800">{formatDate(event.end_date)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt>Budget</dt>
            <dd className="font-semibold text-slate-900">{formatBudget(event.budget)}</dd>
          </div>
        </dl>
      </article>
    </Link>
  )
}