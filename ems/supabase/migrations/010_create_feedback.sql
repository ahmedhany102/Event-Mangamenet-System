CREATE TABLE IF NOT EXISTS public.feedback (
  id bigserial PRIMARY KEY,
  event_id bigint NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  attendee_id bigint NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT uq_feedback UNIQUE (event_id, attendee_id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_feedback" ON public.feedback;

CREATE POLICY "dev_full_access_feedback"
ON public.feedback
FOR ALL
USING (true)
WITH CHECK (true);