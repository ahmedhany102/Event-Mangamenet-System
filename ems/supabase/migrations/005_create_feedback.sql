CREATE TABLE public.feedback (
id bigint NOT NULL DEFAULT nextval('feedback_id_seq'::regclass),
event_id bigint NOT NULL,
attendee_id bigint NOT NULL,
rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
comment text,
created_at timestamp with time zone DEFAULT now(),
CONSTRAINT feedback_pkey PRIMARY KEY (id),
CONSTRAINT feedback_event_id_fkey
FOREIGN KEY (event_id) REFERENCES public.events(id),
CONSTRAINT feedback_attendee_id_fkey
FOREIGN KEY (attendee_id) REFERENCES public.attendees(id)
);
