CREATE TABLE IF NOT EXISTS public.tickets (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  attendee_id BIGINT NOT NULL,
  ticket_code TEXT NOT NULL,
  is_checked_in BOOLEAN NOT NULL DEFAULT false,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_tickets_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_tickets_attendee
    FOREIGN KEY (attendee_id)
    REFERENCES public.attendees(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_tickets_event_attendee
    UNIQUE (event_id, attendee_id),
  CONSTRAINT uq_tickets_ticket_code
    UNIQUE (ticket_code)
);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_tickets" ON public.tickets;

CREATE POLICY "dev_full_access_tickets"
ON public.tickets
FOR ALL
USING (true)
WITH CHECK (true);