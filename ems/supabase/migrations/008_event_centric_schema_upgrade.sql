ALTER TABLE public.event_attendees
ADD COLUMN IF NOT EXISTS id BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'S'
      AND c.relname = 'event_attendees_id_seq'
      AND n.nspname = 'public'
  ) THEN
    CREATE SEQUENCE public.event_attendees_id_seq;
  END IF;
END $$;

ALTER TABLE public.event_attendees
ALTER COLUMN id SET DEFAULT nextval('public.event_attendees_id_seq');

ALTER SEQUENCE public.event_attendees_id_seq
OWNED BY public.event_attendees.id;

UPDATE public.event_attendees
SET id = nextval('public.event_attendees_id_seq')
WHERE id IS NULL;

ALTER TABLE public.event_attendees
ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_pkey;

ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_pkey PRIMARY KEY (id);

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS uq_event_attendees_event_attendee;

ALTER TABLE public.event_attendees
ADD CONSTRAINT uq_event_attendees_event_attendee UNIQUE (event_id, attendee_id);

ALTER TABLE public.event_attendees
DROP COLUMN IF EXISTS ticket_type;

ALTER TABLE public.event_attendees
DROP COLUMN IF EXISTS registration_date;

ALTER TABLE public.event_attendees
ALTER COLUMN attendance_status SET DEFAULT 'registered';

ALTER TABLE public.event_attendees
DROP CONSTRAINT IF EXISTS event_attendees_attendance_status_check;

ALTER TABLE public.event_attendees
ADD CONSTRAINT event_attendees_attendance_status_check
CHECK (attendance_status IN ('registered', 'attended'));

ALTER TABLE public.tickets
ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE public.tickets
DROP CONSTRAINT IF EXISTS uq_tickets_event_attendee;

ALTER TABLE public.tickets
ADD CONSTRAINT uq_tickets_event_attendee UNIQUE (event_id, attendee_id);

ALTER TABLE public.tickets
ALTER COLUMN ticket_code SET NOT NULL;
