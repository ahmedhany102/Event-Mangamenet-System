CREATE TABLE IF NOT EXISTS public.attendees (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT
);

ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_full_access_attendees" ON public.attendees;

CREATE POLICY "dev_full_access_attendees"
ON public.attendees
FOR ALL
USING (true)
WITH CHECK (true);
