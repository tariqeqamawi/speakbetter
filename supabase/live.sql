-- The live sessions, and what is left of them afterwards.
--
-- THE DECISION THIS ENCODES. The live call itself happens on Zoom.
-- Every session is hot-seat coaching - students on camera, being
-- worked with - and that is a two-way room, which is the expensive
-- half of live video to build and the half Zoom already does well.
-- Building it again inside the app would cost weeks and be worse.
--
-- What the app owns is everything around the call: knowing when the
-- next one is, getting into it in one tap, and - the part that
-- actually compounds - the library of every session that has already
-- happened. A student who joins in week three can watch weeks one and
-- two. A student who was in the hot seat can go back to their own
-- ten minutes whenever they like. That library is worth more over a
-- cohort than owning the video pipe would be.
--
-- So: Zoom for the hour, Vimeo for the recording, this for the index.
--
-- Run after schema.sql and chat.sql. Idempotent.

-- ── Sessions ──────────────────────────────────────────────────────────
create table if not exists public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  cohort text not null,

  title text not null,
  -- What this one was about, in a line - this is what a student reads
  -- when deciding whether to watch a replay of something they missed.
  blurb text,

  held_at timestamptz not null,
  duration_sec int,

  -- Where to be, while it is still ahead of us. Cleared afterwards so
  -- an old session cannot send somebody to a dead room.
  join_url text,

  -- Where it lives afterwards. Vimeo, like every other video in the
  -- app, so the player, the privacy settings and the bandwidth bill
  -- are all the ones already in use.
  vimeo_id text,

  -- A session appears in the library when this is true, not when the
  -- recording lands. Tariq gets to trim the first four minutes of
  -- people arriving before anybody sees it.
  published boolean not null default false,

  -- Which challenges this session worked on, so the replay can be
  -- offered from the challenge itself: "Tariq coached this one live on
  -- October 10." The highest-value placement in the app, because it
  -- reaches a student at the moment they are about to record it.
  related_slugs text[] not null default '{}',

  created_at timestamptz not null default now(),

  constraint live_sessions_title_len check (char_length(title) between 1 and 200),
  constraint live_sessions_blurb_len check (blurb is null or char_length(blurb) <= 2000)
);

create index if not exists live_sessions_cohort_held on public.live_sessions (cohort, held_at desc);
create index if not exists live_sessions_published on public.live_sessions (published, held_at desc);
create index if not exists live_sessions_related on public.live_sessions using gin (related_slugs);

alter table public.live_sessions enable row level security;

-- Members see what has been published, and the one coming up. A coach
-- sees everything, including the unpublished recording being trimmed.
drop policy if exists "members read sessions" on public.live_sessions;
create policy "members read sessions" on public.live_sessions
  for select using (
    public.is_coach()
    or (public.is_member() and (published or held_at > now() - interval '3 hours'))
  );

drop policy if exists "coaches write sessions" on public.live_sessions;
create policy "coaches write sessions" on public.live_sessions
  for all using (public.is_coach()) with check (public.is_coach());

-- ── Hot seats ─────────────────────────────────────────────────────────
-- Who was worked with, and at what minute.
--
-- WHY THIS IS ITS OWN TABLE AND NOT A NOTE IN THE BLURB. Being in the
-- hot seat is the most significant ten minutes a student will have in
-- six weeks, and it is buried at 00:34:12 of a ninety-minute recording
-- they will never scrub through to find. A row here turns it into a
-- card on their own dashboard - "your hot seat, October 10" - that
-- opens the player at the right second. It is also the honest record
-- of who has had a turn, which is the thing that quietly decides
-- whether a cohort feels fair.
create table if not exists public.hot_seats (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,

  -- Where their turn starts in the recording.
  at_seconds int not null default 0 check (at_seconds >= 0),
  ends_seconds int check (ends_seconds is null or ends_seconds > at_seconds),

  -- What Tariq worked on with them, in their own record.
  note text,
  -- Which challenge it was about, when it was about one.
  challenge_slug text,

  primary key (session_id, student_id),
  constraint hot_seats_note_len check (note is null or char_length(note) <= 1000)
);

create index if not exists hot_seats_student on public.hot_seats (student_id);
alter table public.hot_seats enable row level security;

-- Everyone in the cohort can see who was in the seat - that is what
-- makes watching a replay worth it, and it is not private information
-- given it happened in front of the whole room. The note is Tariq's
-- and is visible to the student it is about, and to coaches.
drop policy if exists "members read hot seats" on public.hot_seats;
create policy "members read hot seats" on public.hot_seats
  for select using (public.is_member());

drop policy if exists "coaches write hot seats" on public.hot_seats;
create policy "coaches write hot seats" on public.hot_seats
  for all using (public.is_coach()) with check (public.is_coach());

-- ── Attendance ────────────────────────────────────────────────────────
-- Turning up to a live session is practice, and the app should be able
-- to say so - a streak day, a trophy, a line on the dashboard. Written
-- by the student's own device when they open the join link.
create table if not exists public.session_attendance (
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  -- 'live' if they were in the room, 'replay' if they watched it after.
  kind text not null default 'live' check (kind in ('live','replay')),
  at timestamptz not null default now(),
  primary key (session_id, student_id, kind)
);

alter table public.session_attendance enable row level security;

drop policy if exists "read attendance" on public.session_attendance;
create policy "read attendance" on public.session_attendance
  for select using (public.is_coach() or student_id = auth.uid());

drop policy if exists "mark own attendance" on public.session_attendance;
create policy "mark own attendance" on public.session_attendance
  for all using (student_id = auth.uid())
  with check (public.is_member() and student_id = auth.uid());

-- ── The next one, and the ones behind us ──────────────────────────────
-- What the Live page and the Today card both ask for. A view so the
-- "is it on now" arithmetic lives in one place rather than in two
-- components that will drift apart.
create or replace view public.live_schedule
with (security_invoker = on) as
select
  s.*,
  (now() between s.held_at - interval '15 minutes'
             and s.held_at + coalesce(s.duration_sec, 5400) * interval '1 second') as on_now,
  (s.held_at > now()) as upcoming,
  (select count(*)::int from public.hot_seats h where h.session_id = s.id) as seats
from public.live_sessions s;

grant select on public.live_schedule to authenticated;
