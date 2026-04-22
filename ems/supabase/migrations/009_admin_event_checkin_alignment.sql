-- Align schema with event-centric admin check-in flow.
-- Safe to run on existing databases with partial schema differences.

DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY (c.conkey)
    WHERE n.nspname = 'public'
      AND t.relname = 'events'
      AND c.contype = 'f'
      AND a.attname = 'venue_id'
  LOOP
    EXECUTE format('ALTER TABLE public.events DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.events
DROP COLUMN IF EXISTS venue_id;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS venue TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS vip_code TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS speaker_code TEXT;

ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS capacity INTEGER;

UPDATE public.events
SET capacity = 100
WHERE capacity IS NULL OR capacity <= 0;

UPDATE public.events
SET vip_code = CONCAT('VIP-', UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6)))
WHERE vip_code IS NULL OR BTRIM(vip_code) = '';

UPDATE public.events
SET speaker_code = CONCAT('SPK-', UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6)))
WHERE speaker_code IS NULL OR BTRIM(speaker_code) = '';

ALTER TABLE public.events
ALTER COLUMN vip_code SET NOT NULL;

ALTER TABLE public.events
ALTER COLUMN speaker_code SET NOT NULL;

ALTER TABLE public.events
ALTER COLUMN capacity SET NOT NULL;

ALTER TABLE public.events
ALTER COLUMN venue DROP NOT NULL;

ALTER TABLE public.events
ALTER COLUMN venue DROP DEFAULT;

ALTER TABLE public.events
DROP CONSTRAINT IF EXISTS events_capacity_check;

ALTER TABLE public.events
ADD CONSTRAINT events_capacity_check CHECK (capacity > 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'events'
      AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.events
    ALTER COLUMN organization_id DROP NOT NULL;
  END IF;
END $$;

ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS ticket_code TEXT;

ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS ticket_type TEXT;

UPDATE public.event_attendees
SET ticket_type = 'student'
WHERE ticket_type IS NULL;

UPDATE public.event_attendees ea
SET ticket_code = t.ticket_code
FROM public.tickets t
WHERE ea.ticket_code IS NULL
  AND ea.event_id = t.event_id
  AND ea.attendee_id = t.attendee_id;

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS uq_event_attendees_ticket_code;

ALTER TABLE public.event_attendees
ADD CONSTRAINT uq_event_attendees_ticket_code UNIQUE (ticket_code);

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS uq_event_attendees_event_attendee;

ALTER TABLE public.event_attendees
ADD CONSTRAINT uq_event_attendees_event_attendee UNIQUE (event_id, attendee_id);

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_attendance_status_check;

ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_attendance_status_check
CHECK (attendance_status IN ('registered', 'attended'));

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_ticket_type_check;

ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_ticket_type_check
CHECK (ticket_type IN ('student', 'vip', 'speaker'));


