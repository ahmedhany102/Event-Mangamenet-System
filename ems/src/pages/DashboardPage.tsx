import { useEffect, useMemo, useState } from 'react'
import AttendanceChart from '../components/dashboard/AttendanceChart'
import EventsTable from '../components/dashboard/EventsTable'
import RecentActivityList from '../components/dashboard/RecentActivityList'
import StatCard from '../components/dashboard/StatCard'
import TasksChart from '../components/dashboard/TasksChart'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
  organization_id: number
}

type OrganizationRow = {
  id: number
  name: string
}

type EventAttendeeRow = {
  event_id: number
  attendee_id: number
  attendance_status: 'registered' | 'attended' | 'cancelled' | string
}

type TicketRow = {
  id: number
  ticket_code: string
  event_id: number
  attendee_id: number
  is_checked_in: boolean
  issued_at?: string | null
}

type AttendeeRow = {
  id: number
  full_name: string
}

type TaskRow = {
  id: number
  status: string
}

type EventSummaryRow = {
  eventId: number
  eventName: string
  organizationName: string
  registered: number
  attended: number
  attendanceRate: number
}

type TaskStatusRow = {
  status: string
  count: number
}

type RecentActivityItem = {
  id: string
  type: 'registration' | 'ticket' | 'checkin'
  title: string
  subtitle: string
  createdAt: string
}

type DateFilter = 'all' | '7d' | '30d' | '90d'

function toISODateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0.0%'
  return `${value.toFixed(1)}%`
}

export default function DashboardPage() {
  const [events, setEvents] = useState<EventRow[]>([])
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([])
  const [eventAttendees, setEventAttendees] = useState<EventAttendeeRow[]>([])
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [attendees, setAttendees] = useState<AttendeeRow[]>([])
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [selectedEventId, setSelectedEventId] = useState<'all' | string>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      setError(null)

      const [
        { data: eventsData, error: eventsError },
        { data: organizationsData, error: organizationsError },
        { data: eventAttendeesData, error: eventAttendeesError },
        { data: ticketsData, error: ticketsError },
        { data: attendeesData, error: attendeesError },
        { data: tasksData, error: tasksError },
      ] = await Promise.all([
        supabase.from('events').select('id,name,organization_id').order('name', { ascending: true }),
        supabase.from('organizations').select('id,name'),
        supabase
          .from('event_attendees')
          .select('event_id,attendee_id,attendance_status')
          .order('event_id', { ascending: false }),
        supabase
          .from('tickets')
          .select('id,ticket_code,event_id,attendee_id,is_checked_in,issued_at')
          .order('issued_at', { ascending: false }),
        supabase.from('attendees').select('id,full_name').order('id', { ascending: false }),
        supabase.from('tasks').select('id,status'),
      ])

      const firstError =
        eventsError || organizationsError || eventAttendeesError || ticketsError || attendeesError || tasksError

      if (firstError) {
        setError(firstError.message)
        setEvents([])
        setOrganizations([])
        setEventAttendees([])
        setTickets([])
        setAttendees([])
        setTasks([])
      } else {
        setEvents((eventsData as EventRow[]) ?? [])
        setOrganizations((organizationsData as OrganizationRow[]) ?? [])
        setEventAttendees((eventAttendeesData as EventAttendeeRow[]) ?? [])
        setTickets((ticketsData as TicketRow[]) ?? [])
        setAttendees((attendeesData as AttendeeRow[]) ?? [])
        setTasks((tasksData as TaskRow[]) ?? [])
      }

      setLoading(false)
    }

    void fetchDashboardData()
  }, [])

  const since = useMemo(() => {
    if (dateFilter === '7d') return toISODateOffset(7)
    if (dateFilter === '30d') return toISODateOffset(30)
    if (dateFilter === '90d') return toISODateOffset(90)
    return null
  }, [dateFilter])

  const organizationById = useMemo(() => {
    return new Map(organizations.map((organization) => [organization.id, organization.name]))
  }, [organizations])

  const attendeeById = useMemo(() => {
    return new Map(attendees.map((attendee) => [attendee.id, attendee.full_name]))
  }, [attendees])

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const eventMatch = selectedEventId === 'all' || String(ticket.event_id) === selectedEventId
      const dateMatch = !since || (ticket.issued_at ? ticket.issued_at >= since : true)
      return eventMatch && dateMatch
    })
  }, [tickets, selectedEventId, since])

  const filteredEventAttendees = useMemo(() => {
    return eventAttendees.filter((row) => {
      return selectedEventId === 'all' || String(row.event_id) === selectedEventId
    })
  }, [eventAttendees, selectedEventId])

  const filteredAttendees = attendees

  const eventsSummary = useMemo<EventSummaryRow[]>(() => {
    const rows = events
      .filter((event) => selectedEventId === 'all' || String(event.id) === selectedEventId)
      .map((event) => {
        const eventRows = filteredEventAttendees.filter((row) => row.event_id === event.id)
        const registered = eventRows.length
        const attended = eventRows.filter((row) => row.attendance_status === 'attended').length
        const attendanceRate = registered > 0 ? (attended * 100) / registered : 0

        return {
          eventId: event.id,
          eventName: event.name,
          organizationName: organizationById.get(event.organization_id) ?? 'Unknown Organization',
          registered,
          attended,
          attendanceRate,
        }
      })

    return rows.sort((a, b) => b.registered - a.registered)
  }, [events, filteredEventAttendees, organizationById, selectedEventId])

  const tasksSummary = useMemo<TaskStatusRow[]>(() => {
    const counts = tasks.reduce<Record<string, number>>((acc, task) => {
      const key = task.status || 'unknown'
      acc[key] = (acc[key] ?? 0) + 1
      return acc
    }, {})

    const ordered = ['todo', 'in_progress', 'done']
    const orderedRows = ordered.map((status) => ({ status, count: counts[status] ?? 0 }))
    const remainingRows = Object.entries(counts)
      .filter(([status]) => !ordered.includes(status))
      .map(([status, count]) => ({ status, count }))

    return [...orderedRows, ...remainingRows]
  }, [tasks])

  const recentActivity = useMemo<RecentActivityItem[]>(() => {
    const issuedAtByEventAttendee = new Map<string, string>()
    filteredTickets.forEach((ticket) => {
      const key = `${ticket.event_id}-${ticket.attendee_id}`
      if (!issuedAtByEventAttendee.has(key) && ticket.issued_at) {
        issuedAtByEventAttendee.set(key, ticket.issued_at)
      }
    })

    const registrationItems: RecentActivityItem[] = filteredEventAttendees.slice(0, 10).map((row, index) => {
      const eventName = events.find((event) => event.id === row.event_id)?.name ?? `Event ${row.event_id}`
      const attendeeName = attendeeById.get(row.attendee_id) ?? `Attendee ${row.attendee_id}`
      const activityDate = issuedAtByEventAttendee.get(`${row.event_id}-${row.attendee_id}`) ?? new Date(0).toISOString()

      return {
        id: `registration-${row.event_id}-${row.attendee_id}-${index}`,
        type: 'registration',
        title: `New attendee registered for ${eventName}`,
        subtitle: attendeeName,
        createdAt: activityDate,
      }
    })

    const ticketItems: RecentActivityItem[] = filteredTickets.slice(0, 10).map((ticket) => {
      const eventName = events.find((event) => event.id === ticket.event_id)?.name ?? `Event ${ticket.event_id}`
      return {
        id: `ticket-${ticket.id}`,
        type: 'ticket',
        title: `Ticket generated for ${eventName}`,
        subtitle: `Code: ${ticket.ticket_code}`,
        createdAt: ticket.issued_at ?? new Date(0).toISOString(),
      }
    })

    const checkInItems: RecentActivityItem[] = filteredTickets
      .filter((ticket) => ticket.is_checked_in)
      .slice(0, 10)
      .map((ticket) => {
        const attendeeName = attendeeById.get(ticket.attendee_id) ?? `Attendee ${ticket.attendee_id}`
        return {
          id: `checkin-${ticket.id}`,
          type: 'checkin',
          title: 'Check-in completed',
          subtitle: `${attendeeName} (${ticket.ticket_code})`,
          createdAt: ticket.issued_at ?? new Date(0).toISOString(),
        }
      })

    return [...registrationItems, ...ticketItems, ...checkInItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  }, [attendeeById, events, filteredEventAttendees, filteredTickets])

  const totalEvents = selectedEventId === 'all' ? events.length : eventsSummary.length
  const totalAttendees = filteredAttendees.length
  const totalTickets = filteredTickets.length
  const checkedInCount = filteredTickets.filter((ticket) => ticket.is_checked_in).length
  const attendanceRate = totalTickets > 0 ? (checkedInCount * 100) / totalTickets : 0
  const totalTasks = tasksSummary.reduce((sum, item) => sum + item.count, 0)

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-slate-600">Real-time overview of events, attendance, tickets, and tasks.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All events</option>
            {events.map((event) => (
              <option key={event.id} value={String(event.id)}>
                {event.name}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            <option value="all">All time</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
      </header>

      {loading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
            <div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-slate-100" />
          </div>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
          Failed to load dashboard: {error}
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Events"
              value={String(totalEvents)}
              description="Number of events in scope"
              accentClassName="bg-slate-900"
            />
            <StatCard
              title="Total Attendees"
              value={String(totalAttendees)}
              description="Attendee records in selected period"
              accentClassName="bg-sky-700"
            />
            <StatCard
              title="Total Tickets"
              value={String(totalTickets)}
              description="Tickets generated"
              accentClassName="bg-amber-600"
            />
            <StatCard
              title="Checked-in Attendees"
              value={String(checkedInCount)}
              description={`Attendance rate ${formatPercent(attendanceRate)}`}
              accentClassName="bg-emerald-700"
            />
          </div>

          <AttendanceChart checkedIn={checkedInCount} total={totalTickets} />

          <EventsTable rows={eventsSummary} />

          <div className="grid gap-6 lg:grid-cols-2">
            <TasksChart rows={tasksSummary} totalTasks={totalTasks} />
            <RecentActivityList items={recentActivity} />
          </div>
        </div>
      ) : null}
    </section>
  )
}