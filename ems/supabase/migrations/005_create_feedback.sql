CREATE TABLE IF NOT EXISTS public.feedback (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  attendee_id BIGINT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_feedback_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_feedback_attendee
    FOREIGN KEY (attendee_id)
    REFERENCES public.attendees(id)
    ON DELETE CASCADE,
  CONSTRAINT uq_feedback
    UNIQUE (event_id, attendee_id)
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_feedback" ON public.feedback;

CREATE POLICY "dev_full_access_feedback"
ON public.feedback
FOR ALL
USING (true)
WITH CHECK (true);