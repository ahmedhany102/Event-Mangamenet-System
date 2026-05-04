import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../lib/supabase'

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
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AnnouncementsSection({ eventId }: Props) {
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('announcements')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })

    if (!fetchError) {
      setAnnouncements((data as AnnouncementRow[]) ?? [])
    }
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    void loadAnnouncements()
  }, [loadAnnouncements])

  function resetForm() {
    setTitle('')
    setContent('')
    setImageFile(null)
    setImagePreview(null)
    setEditingId(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function startEdit(announcement: AnnouncementRow) {
    setTitle(announcement.title)
    setContent(announcement.content)
    setImageFile(null)
    setImagePreview(announcement.image_url)
    setEditingId(announcement.id)
    setError(null)
  }

  async function uploadImage(file: File): Promise<string | null> {
    // Try Supabase Storage first
    const ext = file.name.split('.').pop()
    const filePath = `announcements/${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage.from('announcement-images').upload(filePath, file)

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('announcement-images').getPublicUrl(filePath)
      return urlData?.publicUrl ?? null
    }

    // Fallback: convert image to base64 data URL
    console.warn('Storage upload failed, falling back to data URL:', uploadError.message)
    return new Promise<string | null>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        resolve(reader.result as string)
      }
      reader.onerror = () => {
        resolve(null)
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.')
      return
    }

    setSubmitting(true)
    setError(null)

    let imageUrl: string | null = imagePreview && !imageFile ? imagePreview : null

    if (imageFile) {
      imageUrl = await uploadImage(imageFile)
      if (!imageUrl) {
        setError('Failed to upload image. Make sure the storage bucket "announcement-images" exists.')
        setSubmitting(false)
        return
      }
    }

    if (editingId !== null) {
      const { error: updateError } = await supabase
        .from('announcements')
        .update({
          title: title.trim(),
          content: content.trim(),
          image_url: imageUrl,
        })
        .eq('id', editingId)

      if (updateError) {
        setError(updateError.message)
        setSubmitting(false)
        return
      }
    } else {
      const { error: insertError } = await supabase.from('announcements').insert({
        event_id: eventId,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl,
      })

      if (insertError) {
        setError(insertError.message)
        setSubmitting(false)
        return
      }
    }

    resetForm()
    await loadAnnouncements()
    setSubmitting(false)
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this announcement?')) return

    setDeletingId(id)

    const { error: deleteError } = await supabase.from('announcements').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    await loadAnnouncements()
  }

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-slate-900">Event Announcements</h3>
      <p className="mt-2 text-sm text-slate-600">Create and manage announcements for this event.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div>
          <label htmlFor="announcement-title" className="mb-1 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="announcement-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Announcement title"
            required
          />
        </div>

        <div>
          <label htmlFor="announcement-content" className="mb-1 block text-sm font-medium text-slate-700">
            Content
          </label>
          <textarea
            id="announcement-content"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            placeholder="Write your announcement..."
            required
          />
        </div>

        <div>
          <label htmlFor="announcement-image" className="mb-1 block text-sm font-medium text-slate-700">
            Image (optional)
          </label>
          <input
            ref={fileInputRef}
            id="announcement-image"
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null
              setImageFile(file)
              if (file) {
                setImagePreview(URL.createObjectURL(file))
              } else {
                setImagePreview(null)
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-xs file:font-medium file:text-slate-700"
          />
          {imagePreview ? (
            <div className="relative mt-2 inline-block">
              <img src={imagePreview} alt="Preview" className="h-24 rounded-lg border border-slate-200 object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  setImagePreview(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] text-white"
              >
                &times;
              </button>
            </div>
          ) : null}
        </div>

        {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Saving...' : editingId !== null ? 'Update Announcement' : 'Add Announcement'}
          </button>
          {editingId !== null ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <p className="text-sm text-slate-500">No announcements yet.</p>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h4 className="font-semibold text-slate-900">{announcement.title}</h4>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => startEdit(announcement)}
                    className="rounded-md border border-amber-300 px-2 py-1 text-[11px] font-medium text-amber-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(announcement.id)}
                    disabled={deletingId === announcement.id}
                    className="rounded-md border border-rose-300 px-2 py-1 text-[11px] font-medium text-rose-700 disabled:opacity-60"
                  >
                    {deletingId === announcement.id ? '...' : 'Delete'}
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-500">{formatDate(announcement.created_at)}</p>
              <p className="mt-1 text-sm text-slate-700">{announcement.content}</p>
              {announcement.image_url ? (
                <img
                  src={announcement.image_url}
                  alt={announcement.title}
                  className="mt-2 max-h-40 rounded-lg border border-slate-200 object-cover"
                />
              ) : null}
            </div>
          ))
        )}
      </div>
    </article>
  )
}