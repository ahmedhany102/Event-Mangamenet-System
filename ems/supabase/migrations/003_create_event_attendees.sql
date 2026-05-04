CREATE TABLE IF NOT EXISTS public.event_attendees (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  attendee_id BIGINT NOT NULL,
  attendance_status TEXT NOT NULL DEFAULT 'registered'
    CHECK (attendance_status IN ('registered', 'attended')),
  checked_in_at TIMESTAMPTZ,
  ticket_code TEXT,
  ticket_type TEXT NOT NULL DEFAULT 'student'
    CHECK (ticket_type IN ('student', 'vip', 'speaker')),
  CONSTRAINT fk_event_attendees_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_attendees_attendee
    FOREIGN KEY (attendee_id)
    REFERENCES public.attendees(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_event_attendees_event_attendee
    UNIQUE (event_id, attendee_id),
  CONSTRAINT uq_event_attendees_ticket_code
    UNIQUE (ticket_code)
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_event_attendees" ON public.event_attendees;

CREATE POLICY "dev_full_access_event_attendees"
ON public.event_attendees
FOR ALL
USING (true)
WITH CHECK (true);