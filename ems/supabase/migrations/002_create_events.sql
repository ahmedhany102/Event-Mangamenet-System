CREATE TABLE IF NOT EXISTS public.events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  vip_code TEXT NOT NULL,
  speaker_code TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  CONSTRAINT events_capacity_check CHECK (capacity > 0)
);