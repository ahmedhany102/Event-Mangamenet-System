CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id BIGINT NOT NULL,
  attendee_id BIGINT NOT NULL,
  ticket_type TEXT NOT NULL DEFAULT 'regular'
    CHECK (ticket_type IN ('regular', 'vip', 'student')),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_status TEXT NOT NULL DEFAULT 'registered'
    CHECK (attendance_status IN ('registered', 'attended', 'cancelled')),
  PRIMARY KEY (event_id, attendee_id),
  CONSTRAINT fk_event_attendees_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_event_attendees_attendee
    FOREIGN KEY (attendee_id)
    REFERENCES public.attendees(id)
    ON DELETE CASCADE
);

ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_event_attendees" ON public.event_attendees;

CREATE POLICY "dev_full_access_event_attendees"
ON public.event_attendees
FOR ALL
USING (true)
WITH CHECK (true);
