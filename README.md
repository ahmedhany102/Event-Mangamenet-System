# Event Management System (EMS)

This project implements a production-level event control architecture with clear separation between:

1. Public users (no login)
2. Admin users (protected dashboard)

## Architecture Summary

- Public routes are focused on event discovery and secure registration.
- Admin runs all controls from a single dashboard route.
- Event operations are event-centric: registration, ticketing, check-in, analytics, and export.

## Public Flow

1. Open `/` to view events.
2. Open `/events/:id` to view event details.
3. Submit registration form (full name, email, phone).
4. System executes:
   - find/create attendee
   - register attendee in `event_attendees`
   - validate ticket type access code when needed
   - generate unique `ticket_code`
   - create `tickets` record
   - generate QR payload `{ ticket_code, event_id }`
5. User receives QR code, ticket code, and attendance number.

## Admin Flow

1. Open `/admin` (protected) to see event-focused dashboard.
2. Create events directly inside dashboard.
3. System auto-generates secure event codes (`vip_code`, `speaker_code`).
4. Open any event for complete operations:
   - event info and stats
   - registered attendees table
   - attended attendees table
   - manual ticket check-in input
   - camera QR scanner
   - CSV export

## Ticket Type Security

Supported ticket types:

- student
- vip
- speaker

Rules:

- student requires no code
- vip requires event `vip_code`
- speaker requires event `speaker_code`
- invalid code rejects registration

## Check-In Rules

1. Ticket must exist.
2. Ticket must belong to current event.
3. Already-attended records are rejected.
4. Valid check-in updates:
   - `event_attendees.attendance_status = 'attended'`
   - `event_attendees.checked_in_at = now()`

The UI updates instantly after successful check-in:

- attendee removed from Registered table
- attendee added to Attended table
- counters updated without reload

## Database Model

### events

- `id`
- `name`
- `description`
- `start_date`
- `end_date`
- `venue`
- `status`
- `vip_code`
- `speaker_code`

### attendees

- `id`
- `full_name`
- `email`
- `phone`

### event_attendees

- `id`
- `event_id`
- `attendee_id`
- `ticket_code` (unique)
- `ticket_type` (`student` | `vip` | `speaker`)
- `attendance_status` (`registered` | `attended`)
- `checked_in_at`

### tickets

- `id`
- `ticket_code`
- `event_id`
- `attendee_id`

## Key Routes

### Public

- `/`
- `/events/:id`

### Admin

- `/admin`

## Setup

1. Install dependencies in `ems`:

```bash
npm install
```

2. Configure Supabase environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

3. Run development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```
