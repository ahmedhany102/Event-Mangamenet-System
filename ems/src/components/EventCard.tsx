import { Link } from 'react-router-dom'

type EventItem = {
  id: number
  name: string
  venue: string | null
  start_date: string
  end_date: string
  status: string
}

type EventCardProps = {
  event: EventItem
  isFull?: boolean
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

function statusStyles(status: string) {
  if (status.toLowerCase() === 'live') return 'bg-emerald-100 text-emerald-800'
  if (status.toLowerCase() === 'upcoming') return 'bg-blue-100 text-blue-800'
  if (status.toLowerCase() === 'finished') return 'bg-slate-200 text-slate-800'
  if (status === 'active') return 'bg-emerald-100 text-emerald-800'
  if (status === 'planned') return 'bg-blue-100 text-blue-800'
  if (status === 'completed') return 'bg-slate-200 text-slate-800'
  if (status === 'cancelled') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

export default function EventCard({ event, isFull = false }: EventCardProps) {
  return (
    <Link to={`/events/${event.id}`} className="block transition hover:-translate-y-0.5 hover:shadow-md">
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">{event.name}</h3>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {isFull ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-800">Event Full</span>
            ) : null}
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles(event.status)}`}>
              {event.status}
            </span>
          </div>
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
            <dt>Venue</dt>
            <dd className="font-semibold text-slate-900">{event.venue ?? 'TBA'}</dd>
          </div>
        </dl>
      </article>
    </Link>
  )
}