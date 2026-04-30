import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type EventRow = {
  id: number
  name: string
}

export default function FeedbackPage() {
  const { eventId } = useParams<{ eventId: string }>()

  const [event, setEvent] = useState<EventRow | null>(null)
  const [attendeeId, setAttendeeId] = useState<number | null>(null)

  const [step, setStep] = useState<'loading' | 'email' | 'error' | 'alreadySubmitted' | 'feedbackForm' | 'thankYou'>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [emailSubmitting, setEmailSubmitting] = useState(false)

  const [rating, setRating] = useState(5)
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)

  const loadEvent = useCallback(async () => {
    if (!eventId) {
      setErrorMessage('Invalid feedback link.')
      setStep('error')
      return
    }

    const eventNum = Number(eventId)
    if (Number.isNaN(eventNum)) {
      setErrorMessage('Invalid event ID.')
      setStep('error')
      return
    }

    const { data, error } = await supabase.from('events').select('id, name').eq('id', eventNum).single()
    if (error || !data) {
      setErrorMessage('Event not found.')
      setStep('error')
      return
    }

    setEvent(data as EventRow)
    setStep('email')
  }, [eventId])

  useEffect(() => {
    void loadEvent()
  }, [loadEvent])

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!eventId || !email.trim()) return

    setEmailSubmitting(true)
    setErrorMessage(null)

    const normalizedEmail = email.trim().toLowerCase()
    const eventNum = Number(eventId)

    // 1. Find attendee by email
    const { data: attendeeData, error: attendeeError } = await supabase
      .from('attendees')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (attendeeError) {
      setErrorMessage('Something went wrong. Please try again.')
      setStep('error')
      setEmailSubmitting(false)
      return
    }

    if (!attendeeData) {
      setErrorMessage('You are not registered or have not checked in to this event.')
      setStep('error')
      setEmailSubmitting(false)
      return
    }

    const foundAttendeeId = (attendeeData as { id: number }).id

    // 2. Check ticket for this event with is_checked_in = true
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .select('is_checked_in')
      .eq('event_id', eventNum)
      .eq('attendee_id', foundAttendeeId)
      .maybeSingle()

    if (ticketError || !ticketData) {
      setErrorMessage('You are not registered or have not checked in to this event.')
      setStep('error')
      setEmailSubmitting(false)
      return
    }

    if (!(ticketData as { is_checked_in: boolean }).is_checked_in) {
      setErrorMessage('You are not registered or have not checked in to this event.')
      setStep('error')
      setEmailSubmitting(false)
      return
    }

    // 3. Check existing feedback
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('id, event_id, attendee_id, rating, comment')
      .eq('event_id', eventNum)
      .eq('attendee_id', foundAttendeeId)
      .maybeSingle()

    if (feedbackError) {
      setErrorMessage('Something went wrong. Please try again.')
      setStep('error')
      setEmailSubmitting(false)
      return
    }

    if (feedbackData) {
      setStep('alreadySubmitted')
      setEmailSubmitting(false)
      return
    }

    // 4. Proceed to feedback form
    setAttendeeId(foundAttendeeId)
    setStep('feedbackForm')
    setEmailSubmitting(false)
  }

  async function handleFeedbackSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!eventId || !attendeeId) return

    setFeedbackSubmitting(true)
    setErrorMessage(null)

    const { error: insertError } = await supabase.from('feedback').insert({
      event_id: Number(eventId),
      attendee_id: attendeeId,
      rating,
      comment: comment.trim() || null,
    })

    if (insertError) {
      setErrorMessage(insertError.message)
      setStep('error')
      setFeedbackSubmitting(false)
      return
    }

    setStep('thankYou')
    setFeedbackSubmitting(false)
  }

  if (step === 'loading') {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-600">
          Loading...
        </div>
      </section>
    )
  }

  if (step === 'error') {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-700">
          {errorMessage}
        </div>
      </section>
    )
  }

  if (step === 'alreadySubmitted') {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mb-4 text-4xl">&#11088;</div>
          <h2 className="text-xl font-semibold text-emerald-800">You have already submitted your feedback, thank you!</h2>
        </div>
      </section>
    )
  }

  if (step === 'thankYou') {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mb-4 text-4xl">&#11088;</div>
          <h2 className="text-xl font-semibold text-emerald-800">Thank you for your feedback!</h2>
          <p className="mt-2 text-sm text-emerald-700">Your response has been recorded.</p>
        </div>
      </section>
    )
  }

  if (step === 'email') {
    return (
      <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold text-slate-900">Event Feedback</h1>
          <p className="mb-6 text-sm text-slate-600">
            Sharing your thoughts for <span className="font-semibold text-slate-900">{event?.name}</span>
          </p>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
                Enter your email to continue
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={emailSubmitting}
              className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
            >
              {emailSubmitting ? 'Checking...' : 'Continue'}
            </button>
          </form>
        </div>
      </section>
    )
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Event Feedback</h1>
        <p className="mb-6 text-sm text-slate-600">
          Sharing your thoughts for <span className="font-semibold text-slate-900">{event?.name}</span>
        </p>

        <form onSubmit={handleFeedbackSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(null)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= (hoveredRating ?? rating) ? '\u2B50' : '\u2606'}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Selected: {rating} star{rating !== 1 ? 's' : ''}
            </p>
          </div>

          <div>
            <label htmlFor="comment" className="mb-1 block text-sm font-medium text-slate-700">
              Comment (optional)
            </label>
            <textarea
              id="comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={feedbackSubmitting}
            className="w-full rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </section>
  )
}