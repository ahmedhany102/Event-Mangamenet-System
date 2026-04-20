export type ParsedCheckInInput = {
  source: 'qr' | 'manual'
  ticketCode: string
  qrEventId: number | null
}

function parseEventId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

export function parseCheckInInput(rawInput: string): ParsedCheckInInput {
  const value = rawInput.trim()

  if (!value) {
    throw new Error('Ticket code or QR payload is required')
  }

  try {
    const parsed = JSON.parse(value) as {
      ticket_code?: unknown
      event_id?: unknown
    }

    const ticketCode = typeof parsed.ticket_code === 'string' ? parsed.ticket_code.trim() : ''
    const eventId = parseEventId(parsed.event_id)

    if (ticketCode && eventId !== null) {
      return {
        source: 'qr',
        ticketCode,
        qrEventId: eventId,
      }
    }
  } catch {
    // Allow manual ticket-code input when payload is not JSON.
  }

  return {
    source: 'manual',
    ticketCode: value,
    qrEventId: null,
  }
}
