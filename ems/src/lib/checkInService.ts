import { supabase } from './supabase'
import { parseCheckInInput } from './qrParser'

type TicketRecord = {
  id: number
  event_id: number
  attendee_id: number
  ticket_code: string
  is_checked_in: boolean
}

type EventAttendeeRecord = {
  attendance_status: 'registered' | 'attended' | string
}

type CheckInParams = {
  selectedEventId: number
  rawInput: string
}

type CheckInResult = {
  ticketId: number
  attendeeId: number
  ticketCode: string
  checkedInAt: string
}

export async function checkInByEvent({ selectedEventId, rawInput }: CheckInParams): Promise<CheckInResult> {
  const parsedInput = parseCheckInInput(rawInput)

  if (parsedInput.qrEventId !== null && parsedInput.qrEventId !== selectedEventId) {
    throw new Error('This ticket does not belong to this event')
  }

  const { data: ticketData, error: ticketError } = await supabase
    .from('tickets')
    .select('id,event_id,attendee_id,ticket_code,is_checked_in')
    .eq('ticket_code', parsedInput.ticketCode)
    .single()

  if (ticketError) {
    const notFound = ticketError.code === 'PGRST116'
    throw new Error(notFound ? 'Invalid ticket' : ticketError.message)
  }

  const ticket = ticketData as TicketRecord

  if (ticket.event_id !== selectedEventId) {
    throw new Error('This ticket does not belong to this event')
  }

  const { data: attendeeData, error: attendeeError } = await supabase
    .from('event_attendees')
    .select('attendance_status')
    .eq('event_id', ticket.event_id)
    .eq('attendee_id', ticket.attendee_id)
    .single()

  if (attendeeError) {
    const notFound = attendeeError.code === 'PGRST116'
    throw new Error(notFound ? 'Registration record not found for this ticket' : attendeeError.message)
  }

  const attendee = attendeeData as EventAttendeeRecord

  if (attendee.attendance_status === 'attended' || ticket.is_checked_in) {
    throw new Error('Already checked in')
  }

  const checkedInAt = new Date().toISOString()

  const { error: attendanceUpdateError } = await supabase
    .from('event_attendees')
    .update({
      attendance_status: 'attended',
      checked_in_at: checkedInAt,
    })
    .eq('event_id', ticket.event_id)
    .eq('attendee_id', ticket.attendee_id)

  if (attendanceUpdateError) {
    throw new Error(attendanceUpdateError.message)
  }

  const { error: ticketUpdateError } = await supabase
    .from('tickets')
    .update({ is_checked_in: true })
    .eq('id', ticket.id)

  if (ticketUpdateError) {
    throw new Error(ticketUpdateError.message)
  }

  return {
    ticketId: ticket.id,
    attendeeId: ticket.attendee_id,
    ticketCode: ticket.ticket_code,
    checkedInAt,
  }
}
