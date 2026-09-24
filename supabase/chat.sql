-- The cohort talking to itself (master plan §12).
--
-- Three standing rooms, and a thread attached to every challenge.
--
-- WHY THE PER-CHALLENGE THREADS MATTER MOST. A general chat room in a
-- six-week cohort is loud in week one and silent by week three - that
-- is not a failure of moderation, it is what happens when a room has
-- no reason to exist at a particular moment. A thread pinned to a
-- challenge has the opposite shape: it is there at the exact moment
-- somebody needs it, because they are standing on that challenge
-- about to record. It also COMPOUNDS - the second cohort walks onto
-- every challenge and finds the first cohort's advice already waiting.
-- That is the asset here; the standing rooms are the social glue.
--
-- Run after schema.sql. Idempotent: safe to run again.

-- ── Who may speak ─────────────────────────────────────────────────────
-- Paying students only. The trial can read the app but not the room:
-- a course chat is worth what its signal-to-noise is, and free-tier
-- access is how that gets spent.
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and plan <> 'trial'
  );
$$;

-- Tariq, and anyone he hands the keys to. Coaches can pin, hide and
-- post in any room; students can do none of those things.
alter table public.profiles
  add column if not exists role text not null default 'student';

do $$ begin
  alter table public.profiles
    add constraint profiles_role_check check (role in ('student','coach'));
exception when duplicate_object then null; end $$;

create or replace function public.is_coach()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'coach'
  );
$$;

-- ── Posts ─────────────────────────────────────────────────────────────
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,

  -- Which room. One of the three standing rooms, or 'challenge:<slug>'
  -- for the thread that hangs off a particular challenge. One column
  -- rather than a rooms table, because the rooms are not user-created
  -- and a join buys nothing.
  room text not null,

  -- Which cohort was talking. The standing rooms are filtered to the
  -- current one, so a new cohort arrives to a clean room; the
  -- challenge threads deliberately are NOT filtered, so their advice
  -- accumulates across cohorts. The app decides; the column just
  -- records the truth.
  cohort text,

  body text not null,
  at timestamptz not null default now(),
  edited_at timestamptz,

  -- One level of replies, no more. Nested threads in a course chat
  -- turn into a tree nobody reads; a reply that answers a message is
  -- the whole of what is needed. Enforced by trigger below.
  reply_to uuid references public.posts(id) on delete cascade,

  -- Tariq putting a message at the top of a challenge thread - the
  -- worked example, the common mistake. The single most valuable
  -- moderation tool, and the cheapest.
  pinned_at timestamptz,

  -- Soft moderation. A hidden post stops existing for students and
  -- stays visible to coaches, because a deleted row cannot be reviewed
  -- and a report with nothing behind it is useless.
  hidden_at timestamptz,
  hidden_by uuid references public.profiles(id) on delete set null,

  -- WHY THE AUTHOR IS COPIED IN RATHER THAN JOINED. Realtime delivers
  -- the raw row and nothing else. With the name in profiles, every
  -- message arriving live would need a second round trip before it
  -- could be drawn - on every message, for every reader. Copying the
  -- name and face onto the post at insert makes the live path a pure
  -- append, and as a bonus keeps profiles completely sealed: nobody
  -- needs read access to anybody else's row for chat to work.
  --
  -- The trade is that renaming yourself does not rewrite your old
  -- posts. For a chat that is arguably the correct behaviour anyway.
  author_name text not null default '',
  author_avatar text,

  constraint posts_body_len check (char_length(body) between 1 and 2000),
  constraint posts_room_shape check (
    room in ('general','feedback','challenges')
    or room ~ '^challenge:[a-z0-9][a-z0-9-]{0,79}$'
  ),
  -- A post cannot reply to itself.
  constraint posts_reply_not_self check (reply_to is null or reply_to <> id)
);

-- The read that happens constantly: one room, newest last.
create index if not exists posts_room_at on public.posts (room, at desc);
create index if not exists posts_reply_to on public.posts (reply_to) where reply_to is not null;
create index if not exists posts_student on public.posts (student_id, at desc);
create index if not exists posts_pinned on public.posts (room, pinned_at desc) where pinned_at is not null;

-- ── The rules a post has to pass ──────────────────────────────────────
create or replace function public.posts_before_write()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  parent public.posts%rowtype;
  recent int;
begin
  if tg_op = 'INSERT' then
    -- The author is whoever is asking, always. The client never gets
    -- to name themselves, so a forged student_id is not a thing that
    -- can be attempted.
    new.student_id := auth.uid();
    new.at := now();

    select coalesce(display_name, 'Someone'), avatar_url
      into new.author_name, new.author_avatar
      from public.profiles where id = new.student_id;

    -- One level of replies. A reply to a reply becomes a reply to its
    -- parent instead of an error, because the alternative is losing
    -- somebody's message over a structural rule they cannot see.
    if new.reply_to is not null then
      select * into parent from public.posts where id = new.reply_to;
      if not found then
        raise exception 'replying to a message that is not there';
      end if;
      if parent.reply_to is not null then
        new.reply_to := parent.reply_to;
      end if;
      -- A reply belongs in its parent's room whatever it was told.
      new.room := parent.room;
    end if;

    -- A hand brake, not a rate limiter. Enough to stop a stuck key or
    -- a script; nowhere near enough to notice while typing.
    select count(*) into recent
      from public.posts
      where student_id = new.student_id and at > now() - interval '1 minute';
    if recent >= 10 then
      raise exception 'slow down a moment';
    end if;

  elsif tg_op = 'UPDATE' then
    -- Students may fix their own words and nothing else. Every other
    -- column is put back to what it was, so an UPDATE cannot be used
    -- to move a post, re-date it, pin it or unhide it.
    if not public.is_coach() then
      new.student_id := old.student_id;
      new.room := old.room;
      new.cohort := old.cohort;
      new.at := old.at;
      new.reply_to := old.reply_to;
      new.pinned_at := old.pinned_at;
      new.hidden_at := old.hidden_at;
      new.hidden_by := old.hidden_by;
      new.author_name := old.author_name;
      new.author_avatar := old.author_avatar;
      if new.body is distinct from old.body then
        new.edited_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_before_write on public.posts;
create trigger posts_before_write
  before insert or update on public.posts
  for each row execute function public.posts_before_write();

-- ── Who can see and do what ───────────────────────────────────────────
alter table public.posts enable row level security;

drop policy if exists "members read the rooms" on public.posts;
create policy "members read the rooms" on public.posts
  for select using (
    public.is_member() and (hidden_at is null or public.is_coach() or student_id = auth.uid())
  );

drop policy if exists "members post" on public.posts;
create policy "members post" on public.posts
  for insert with check (public.is_member() and student_id = auth.uid());

drop policy if exists "edit own words" on public.posts;
create policy "edit own words" on public.posts
  for update using (
    public.is_coach() or (student_id = auth.uid() and hidden_at is null)
  );

drop policy if exists "delete own post" on public.posts;
create policy "delete own post" on public.posts
  for delete using (public.is_coach() or student_id = auth.uid());

-- ── Reactions ─────────────────────────────────────────────────────────
-- A small, fixed set. An open emoji picker in a confidence course is a
-- way for people to be unkind without typing anything, so every
-- available reaction here is warm by construction.
create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  -- Six, matching ReactionKind in lib/chat.ts. Kept as a check rather
  -- than an enum so adding a seventh is one migration and not two.
  kind text not null check (kind in ('up','cheer','love','fire','same','helpful')),
  at timestamptz not null default now(),
  primary key (post_id, student_id, kind)
);

create index if not exists post_reactions_post on public.post_reactions (post_id);
alter table public.post_reactions enable row level security;

drop policy if exists "members read reactions" on public.post_reactions;
create policy "members read reactions" on public.post_reactions
  for select using (public.is_member());

drop policy if exists "own reactions" on public.post_reactions;
create policy "own reactions" on public.post_reactions
  for all using (student_id = auth.uid()) with check (public.is_member() and student_id = auth.uid());

-- ── Reports ───────────────────────────────────────────────────────────
-- Here from day one rather than after an incident. A student who has
-- just filmed themselves being vulnerable needs to know there is a
-- button, whether or not they ever press it.
create table if not exists public.post_reports (
  post_id uuid not null references public.posts(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  reason text,
  at timestamptz not null default now(),
  primary key (post_id, student_id),
  constraint post_reports_reason_len check (reason is null or char_length(reason) <= 500)
);

alter table public.post_reports enable row level security;

drop policy if exists "report a post" on public.post_reports;
create policy "report a post" on public.post_reports
  for insert with check (public.is_member() and student_id = auth.uid());

-- A reporter can see that they reported; only a coach sees the pile.
drop policy if exists "read reports" on public.post_reports;
create policy "read reports" on public.post_reports
  for select using (public.is_coach() or student_id = auth.uid());

-- ── What a room looks like from outside it ────────────────────────────
-- For the challenge list, which wants to say "14 messages" next to a
-- challenge without loading fourteen messages. security_invoker keeps
-- the reader's own permissions in force, so a non-member counts zero.
create or replace view public.room_activity
with (security_invoker = on) as
select
  room,
  count(*)::int as messages,
  count(distinct student_id)::int as voices,
  max(at) as last_at
from public.posts
where hidden_at is null
group by room;

grant select on public.room_activity to authenticated;

-- ── Live delivery ─────────────────────────────────────────────────────
-- Realtime sends row changes down a websocket. Posts and reactions are
-- the two things that have to arrive without a refresh.
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.post_reactions;
exception when duplicate_object then null; end $$;
