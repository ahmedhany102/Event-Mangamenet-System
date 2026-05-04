CREATE TABLE IF NOT EXISTS public.announcements (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_announcements_event
    FOREIGN KEY (event_id)
    REFERENCES public.events(id)
    ON DELETE CASCADE
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_announcements" ON public.announcements;

CREATE POLICY "dev_full_access_announcements"
ON public.announcements
FOR ALL
USING (true)
WITH CHECK (true);