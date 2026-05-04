create table public.announcements (
  id bigserial not null,
  event_id bigint not null,
  title text not null,
  content text not null,
  image_url text null,
  created_at timestamp with time zone not null default now(),
  constraint announcements_pkey primary key (id),
  constraint fk_announcements_event foreign KEY (event_id) references events (id) on delete CASCADE
)