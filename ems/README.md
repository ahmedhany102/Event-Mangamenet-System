# Event Management System (EMS)

Production-oriented event control platform built with React, TypeScript, Tailwind CSS, and Supabase.

## System Architecture

The platform has two user modes:

1. Public user (no login): browse events and register.
2. Admin (protected): run operations from a single dashboard at `/admin`.

Events are the core entity. Registration, ticketing, check-in, and analytics are all event-scoped.

## Route Model

### Public routes

- `/`
- `/events/:id`

### Admin routes

- `/admin`

Legacy admin event paths now redirect to `/admin`.

## Public Registration Flow

1. User opens `/` and selects an event.
2. User opens `/events/:id` and submits registration form.
3. System executes:
   - create/find attendee by email
   - register attendee in `event_attendees`
   - generate unique `ticket_code`
   - create `tickets` row
   - write `ticket_code` back to `event_attendees`
   - generate QR payload: `{ "ticket_code": "...", "event_id": ... }`
4. User receives QR code, ticket code, and attendance number.

## Secure Ticket Type Logic

Supported ticket types:

- `student` (default)
- `vip`
- `speaker`

Security rules:

1. Public user may select any ticket type, but:
2. `vip` requires matching `events.vip_code`.
3. `speaker` requires matching `events.speaker_code`.
4. Invalid code rejects registration.

## Admin Control Center (`/admin`)

The dashboard is the single operational page and includes:

1. In-page event creation (no separate manage-events page).
2. Auto-generation of `vip_code` and `speaker_code` on event creation.
3. Event list with registered/attended counts.
4. Open-event control panel containing:
   - event information and secure access codes
   - separate Registered and Attended tables
   - manual ticket input and camera QR scan
   - live state updates after check-in
   - analytics cards
   - CSV export

## Check-In Rules

For manual and QR-based check-in:

1. Ticket must exist.
2. Ticket must belong to the current event.
3. Duplicate attendance is blocked.
4. On success:
   - `event_attendees.attendance_status = 'attended'`
   - `event_attendees.checked_in_at = now()`

## Event Analytics

Displayed per event in admin control panel:

1. Registered count
2. Attended count
3. Attendance rate
4. No-show rate
5. Peak check-in time bucket

## CSV Export

Admin export fields:

1. Full Name
2. Email
3. Phone
4. Ticket Type
5. Attendance Status
6. Check-in Time

## Database Schema (Key Tables)

### events

- `id`
- `name`
- `description`
- `start_date`
- `end_date`
- `venue` (optional text)
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

## Migration

Primary migration for current architecture:

- `supabase/migrations/009_admin_event_checkin_alignment.sql`

It aligns:

1. `events.venue` and removes `venue_id`
2. optional `organization_id`
3. secure event codes (`vip_code`, `speaker_code`)
4. attendee ticket columns and constraints (`ticket_code`, `ticket_type`, `checked_in_at`)

## Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

3. Run app:

```bash
npm run dev
```

4. Production build:

```bash
npm run build
```
