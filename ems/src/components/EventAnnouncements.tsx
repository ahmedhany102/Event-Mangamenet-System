import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type AnnouncementRow = {
  id: number
  event_id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
}

type Props = {
  eventId: number
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function EventAnnouncements({ eventId }: Props) {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (!error) {
      setAnnouncements((data as AnnouncementRow[]) ?? [])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  if (loading) {
    return (
      <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Announcements</h3>
        <p className="mt-3 text-sm text-slate-500">Loading announcements...</p>
      </article>
    )
  }

  if (announcements.length === 0) {
    return null
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-semibold text-slate-900">Announcements</h3>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div key={announcement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
            <p className="mt-1 text-xs text-slate-500">{formatDate(announcement.created_at)}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{announcement.content}</p>
            {announcement.image_url ? (
              <img
                src={announcement.image_url}
                alt={announcement.title}
                className="mt-3 max-h-60 rounded-lg border border-slate-200 object-cover"
              />
            ) : null}
          </div>
        ))}
      </div>
    </article>
  )
}