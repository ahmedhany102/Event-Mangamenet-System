CREATE TABLE public.attendees (
id bigint NOT NULL DEFAULT nextval('attendees_id_seq'::regclass),
full_name text NOT NULL,
email text NOT NULL UNIQUE,
phone text,
CONSTRAINT attendees_pkey PRIMARY KEY (id)
);