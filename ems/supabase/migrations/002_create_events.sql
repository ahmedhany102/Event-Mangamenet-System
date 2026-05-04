CREATE TABLE public.events (
id bigint NOT NULL DEFAULT nextval('events_id_seq'::regclass),
name text NOT NULL,
description text,
start_date date NOT NULL,
end_date date NOT NULL,
budget numeric NOT NULL DEFAULT 0
CHECK (budget >= 0::numeric),
expenditure numeric NOT NULL DEFAULT 0
CHECK (expenditure >= 0::numeric),
status text NOT NULL DEFAULT 'planned'::text
CHECK (status = ANY (ARRAY['planned'::text, 'active'::text,
'completed'::text, 'cancelled'::text]
)),
venue text,
vip_code text NOT NULL,
speaker_code text NOT NULL,
capacity integer NOT NULL CHECK (capacity > 0),
CONSTRAINT events_pkey PRIMARY KEY (id)
);
