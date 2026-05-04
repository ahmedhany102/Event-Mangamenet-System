CREATE TABLE public.tickets (
id bigint NOT NULL DEFAULT nextval('tickets_id_seq'::regclass),
event_id bigint NOT NULL,
attendee_id bigint NOT NULL,
ticket_code text NOT NULL UNIQUE,
issued_at timestamp with time zone NOT NULL DEFAULT now(),
is_checked_in boolean NOT NULL DEFAULT false,
CONSTRAINT tickets_pkey PRIMARY KEY (id),
CONSTRAINT fk_tickets_event
FOREIGN KEY (event_id) REFERENCES public.events(id),
CONSTRAINT fk_tickets_attendee
FOREIGN KEY (attendee_id) REFERENCES public.attendees(id)
);