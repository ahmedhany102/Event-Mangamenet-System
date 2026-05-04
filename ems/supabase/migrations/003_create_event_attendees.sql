CREATE TABLE public.event_attendees (
event_id bigint NOT NULL,
attendee_id bigint NOT NULL,
attendance_status text NOT NULL DEFAULT 'registered'::text
CHECK (attendance_status = ANY (
ARRAY['registered'::text, 'attended'::text])),
id bigint NOT NULL DEFAULT nextval('event_attendees_id_seq'::reg
class),
checked_in_at timestamp with time zone,
ticket_code text UNIQUE,
ticket_type text
CHECK (ticket_type = ANY (
ARRAY['student'::text, 'vip'::text, 'speaker'::text])),
CONSTRAINT event_attendees_pkey PRIMARY KEY (id),
CONSTRAINT fk_event_attendees_event
FOREIGN KEY (event_id) REFERENCES public.events(id),
CONSTRAINT fk_event_attendees_attendee
FOREIGN KEY (attendee_id) REFERENCES public.attendees(id)
);