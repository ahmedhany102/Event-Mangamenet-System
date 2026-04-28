# Event Management System (EMS)

A production-level event management platform built with **React**, **TypeScript**, **Vite**, and **Supabase**. The system separates public-facing features (event discovery, registration, feedback) from admin-only operations (event control, check-in, analytics) behind a protected dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS |
| Backend | Supabase (PostgreSQL + REST API) |
| QR Codes | `qrcode.react`, `html5-qrcode` |
| Routing | React Router DOM |

---

## Features

### Public Features

- **Landing Page** — Browse upcoming events.
- **Event Details** — View event name, venue, description, dates, and capacity.
- **Secure Registration** — Attendees register with full name, email, and phone. The system automatically:
  - Creates or finds an `attendee` record.
  - Registers the attendee in `event_attendees`.
  - Validates VIP/Speaker access codes when required.
  - Generates a unique `ticket_code` and creates a `tickets` record.
  - Returns a QR code payload (`{ ticket_code, event_id }`), ticket code, and attendance number.
- **Event Feedback** — Attendees scan a feedback QR code, enter their email, and submit a star rating (1–5) with an optional comment. Only checked-in attendees may submit feedback. Duplicate submissions are blocked.

### Admin Features

- **Admin Dashboard** — Protected route (`/admin`) with a full event overview table showing:
  - Registered / Attended counts
  - Average feedback rating per event
  - Quick actions (Open Event, Edit, Delete, Show Feedback QR, View Feedback)
- **Event Control Panel** — Deep view into a single event:
  - Event info and access code management (VIP / Speaker)
  - Real-time stats cards (Registered, Attended, Attendance Rate, No-show Rate, Peak Check-in)
  - Registered attendees table
  - Attended attendees table (with check-in timestamp)
  - Manual ticket check-in input
  - Camera-based QR scanner for instant check-in
  - CSV export of all attendees
- **Feedback Results Page** (`/admin/events/:eventId/feedback`) — View all feedback for an event with average rating, total count, and a full submission table.

---

## Architecture

- **Public routes** are unauthenticated and focus on discovery, registration, and feedback.
- **Admin routes** are protected and centralize all control in a single dashboard.
- **Event-centric design** means every operation (registration, ticketing, check-in, analytics, feedback) is scoped to a specific event.

---

## Database Schema

### `events`
Stores event details and access codes.

| Column | Type |
|--------|------|
| id | `bigint` (PK) |
| name | `text` |
| description | `text` |
| start_date | `date` |
| end_date | `date` |
| venue | `text` |
| status | `text` |
| vip_code | `text` |
| speaker_code | `text` |
| capacity | `integer` |

### `attendees`
Stores people who register for events.

| Column | Type |
|--------|------|
| id | `bigint` (PK) |
| full_name | `text` |
| email | `text` (unique) |
| phone | `text` |

### `event_attendees`
Links attendees to events with ticket and attendance metadata.

| Column | Type |
|--------|------|
| id | `bigint` (PK) |
| event_id | `bigint` (FK) |
| attendee_id | `bigint` (FK) |
| ticket_code | `text` |
| ticket_type | `text` |
| attendance_status | `text` (`registered` \| `attended`) |
| checked_in_at | `timestamptz` |

### `tickets`
Stores uniquely generated tickets.

| Column | Type |
|--------|------|
| id | `bigint` (PK) |
| event_id | `bigint` (FK) |
| attendee_id | `bigint` (FK) |
| ticket_code | `text` (unique) |
| is_checked_in | `boolean` |
| issued_at | `timestamptz` |

### `feedback`
Stores attendee feedback.

| Column | Type |
|--------|------|
| id | `bigint` (PK) |
| event_id | `bigint` (FK) |
| attendee_id | `bigint` (FK) |
| rating | `integer` (1–5) |
| comment | `text` |
| created_at | `timestamptz` |

---

## Ticket Type Security

| Type | Access Code Required |
|------|----------------------|
| Student | No |
| VIP | Yes (`vip_code`) |
| Speaker | Yes (`speaker_code`) |

Invalid access codes reject registration immediately.

---

## Check-In Rules

1. Ticket must exist.
2. Ticket must belong to the current event.
3. Already-attended records are rejected.
4. Valid check-in atomically updates:
   - `tickets.is_checked_in = true`
   - `event_attendees.attendance_status = 'attended'`
   - `event_attendees.checked_in_at = now()`

The UI updates instantly after successful check-in: the attendee moves from the *Registered* table to the *Attended* table, and all counters refresh without a page reload.

---

## Key Routes

### Public

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/events` | All events |
| `/events/:id` | Event details & registration |
| `/feedback/:eventId` | Submit feedback |

### Admin

| Route | Description |
|-------|-------------|
| `/admin` | Dashboard (protected) |
| `/admin/events/:eventId/feedback` | Feedback results (protected) |

---

## Setup

### 1. Install Dependencies

```bash
cd ems
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the `ems` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Run Database Migrations

Apply all Supabase migration files in `supabase/migrations/` in numeric order.

### 4. Start Development Server

```bash
npm run dev
```

### 5. Build for Production

```bash
npm run build
```

---

## Project Structure

```
ems/
├─ src/
│  ├─ components/
│  │  ├─ admin/
│  │  │  └─ AdminEventControlPanel.tsx
│  │  ├─ dashboard/
│  │  ├─ landing/
│  │  ├─ EventCard.tsx
│  │  ├─ FeedbackQRModal.tsx
│  │  └─ ProtectedRoute.tsx
│  ├─ lib/
│  │  ├─ supabase.ts
│  │  └─ checkInService.ts
│  ├─ pages/
│  │  ├─ LandingPage.tsx
│  │  ├─ EventsPage.tsx
│  │  ├─ EventDetailsPage.tsx
│  │  ├─ FeedbackPage.tsx
│  │  ├─ FeedbackResultsPage.tsx
│  │  ├─ AdminDashboardPage.tsx
│  │  ├─ CheckInPage.tsx
│  │  └─ LoginPage.tsx
│  ├─ App.tsx
│  └─ main.tsx
├─ supabase/
│  └─ migrations/
│     ├─ 001_create_employees.sql
│     ├─ ...
│     └─ 010_create_feedback.sql
├─ index.html
├─ vite.config.ts
└─ package.json
```

---

## License

MIT
