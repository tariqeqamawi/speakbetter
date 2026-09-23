-- Speak Better on Supabase (master plan §19).
--
-- One row per student, and their work beside it. Everything is theirs:
-- row-level security means a student reads and writes their own rows
-- and nobody else's, except the two places this course is social - the
-- week's board and the shared before-and-afters, which expose a display
-- name and numbers, never a video and never an email.
--
-- Run once in the Supabase SQL editor, or `supabase db push`.

-- ── Profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  created_at timestamptz not null default now(),
  display_name text,
  -- The student's own words about why they're here (§09).
  intention text,
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  -- trial | foundations | coached | founders  (data/pricing.ts)
  plan text not null default 'trial' check (plan in ('trial','foundations','coached','founders')),
  plan_since timestamptz,
  -- Stripe's customer, when commerce lands (§19).
  stripe_customer_id text,
  avatar_url text,
  freezes_remaining int not null default 2,
  xp_spent int not null default 0,
  -- On the week's board, or not - the student's choice (§12).
  on_board boolean not null default false
);

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "insert own profile" on public.profiles
  for insert with check (auth.uid() = id);
create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- A profile row appears the moment somebody signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ── Attempts and their reviews ────────────────────────────────────────
-- The review is the record; the video never comes here (§13). It goes
-- to private Blob storage, is watched, and is deleted.
create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  challenge_slug text not null,
  at timestamptz not null default now(),
  duration_sec int not null,
  passed boolean not null,
  score int not null check (score between 0 and 100),
  spectrum jsonb not null,
  -- Everything Coach returned, in the app's shape (lib/coach/shape.ts):
  -- focus, fullNotes, strengths, lessonsUsed, skillsSpotted,
  -- observations, progress, spoken, summary, criteria, briefVerdict.
  review jsonb not null default '{}'::jsonb,
  -- What the phone measured of the voice (lib/voice-profile.ts).
  voice jsonb
);

create index if not exists attempts_student_at on public.attempts (student_id, at desc);
alter table public.attempts enable row level security;

create policy "read own attempts" on public.attempts
  for select using (auth.uid() = student_id);
create policy "insert own attempts" on public.attempts
  for insert with check (auth.uid() = student_id);
create policy "update own attempts" on public.attempts
  for update using (auth.uid() = student_id);
create policy "delete own attempts" on public.attempts
  for delete using (auth.uid() = student_id);

-- ── Lessons watched, trophies, streak days, quests ───────────────────
create table if not exists public.watched_lessons (
  student_id uuid not null references public.profiles(id) on delete cascade,
  vimeo_id text not null,
  at timestamptz not null default now(),
  primary key (student_id, vimeo_id)
);
alter table public.watched_lessons enable row level security;
create policy "own watched" on public.watched_lessons
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

create table if not exists public.badges (
  student_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (student_id, badge_id)
);
alter table public.badges enable row level security;
create policy "own badges" on public.badges
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

create table if not exists public.streak_days (
  student_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  -- practised | frozen | bought  (bought = paid for with XP)
  kind text not null default 'practised' check (kind in ('practised','frozen','bought')),
  primary key (student_id, day)
);
alter table public.streak_days enable row level security;
create policy "own streak" on public.streak_days
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

create table if not exists public.quest_chests (
  student_id uuid not null references public.profiles(id) on delete cascade,
  day date not null,
  primary key (student_id, day)
);
alter table public.quest_chests enable row level security;
create policy "own chests" on public.quest_chests
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- ── The social surface ────────────────────────────────────────────────
-- Shared before-and-afters: numbers and a name, never a video.
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  passed int not null,
  -- which challenge each side of the comparison was
  then_slug text,
  now_slug text,
  then_score int not null,
  now_score int not null,
  then_spectrum jsonb not null,
  now_spectrum jsonb not null
);
alter table public.shares enable row level security;
create policy "everyone reads shares" on public.shares for select using (true);
create policy "insert own shares" on public.shares for insert with check (auth.uid() = student_id);
create policy "delete own shares" on public.shares for delete using (auth.uid() = student_id);

-- A cheer is one per student per share.
create table if not exists public.cheers (
  share_id uuid not null references public.shares(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  at timestamptz not null default now(),
  primary key (share_id, student_id)
);
alter table public.cheers enable row level security;
create policy "everyone reads cheers" on public.cheers for select using (true);
create policy "own cheers" on public.cheers
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- The week's board and the community's faces: a name and numbers, and
-- only for students who opted in. security_invoker keeps each reader's
-- own permissions in force.
create or replace view public.week_board
with (security_invoker = on) as
select
  p.id as student_id,
  p.display_name,
  count(a.id) filter (where a.at >= date_trunc('week', now()))::int as week_takes,
  coalesce(max(a.score) filter (where a.at >= date_trunc('week', now())), 0)::int as week_best,
  count(a.id) filter (where a.passed)::int as passed_total
from public.profiles p
left join public.attempts a on a.student_id = p.id
where p.on_board
group by p.id, p.display_name;

grant select on public.week_board to anon, authenticated;
