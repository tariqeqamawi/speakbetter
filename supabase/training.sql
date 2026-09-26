-- How Coach becomes a better coach, and the app a better app.
--
-- Everything here is kept under a STUDENT NUMBER, never a name or an
-- email: Student #40 is followed as an individual - their takes, their
-- ratings, their questions, in order, so their growth reads as one
-- continuous story - but nothing in these tables says who #40 is. The one
-- link from number to person is student_numbers, which no student can
-- read and the admin dashboard never shows.
--
-- No video ever comes here. A take arrives as text: what was said
-- (names already stripped out on the device, lib/insights.ts), what
-- Coach said back, and how the student rated it.
--
-- Students never read these tables. They write to them only through the
-- functions at the bottom, which look up their number for them; the
-- admin dashboard reads them with the service key (lib/supabase/admin.ts).
--
-- Run after schema.sql.

-- ── The number ────────────────────────────────────────────────────────
create table if not exists public.student_numbers (
  number serial primary key,
  student_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.student_numbers enable row level security;
-- (no policies: nobody but the service key reads it)

-- A student's number, handed out the first time they need one.
create or replace function public.my_student_number()
returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if auth.uid() is null then return null; end if;
  select number into n from student_numbers where student_id = auth.uid();
  if n is null then
    insert into student_numbers (student_id) values (auth.uid())
    on conflict (student_id) do nothing;
    select number into n from student_numbers where student_id = auth.uid();
  end if;
  return n;
end;
$$;

-- ── Training takes ────────────────────────────────────────────────────
-- One per recorded challenge: the raw material for teaching Coach.
create table if not exists public.training_takes (
  id uuid primary key default gen_random_uuid(),
  student_no int not null references public.student_numbers(number) on delete cascade,
  at timestamptz not null default now(),
  challenge_slug text not null,
  level text not null,
  duration_sec int,
  -- What the student said, as text, names removed.
  transcript text,
  -- What Coach said back: score, spectrum, focus, notes (the app's shape).
  review jsonb not null default '{}'::jsonb,
  score int,
  passed boolean,
  -- The student's verdict on the review.
  rating text check (rating in ('spot-on','partly','off')),
  rating_note text,
  -- Tariq's hand: the ideal review for this take, and whether it's a
  -- gold example to teach Coach from.
  correction text,
  -- Tariq's own score for the take, to measure how closely Coach agrees
  -- with a human expert (the data room's "Coach vs Tariq").
  tariq_score int check (tariq_score between 0 and 100),
  gold boolean not null default false,
  reviewed_at timestamptz
);
create index if not exists training_takes_student on public.training_takes (student_no, at);
create index if not exists training_takes_rating on public.training_takes (rating);
alter table public.training_takes enable row level security;

-- ── Conversations with Coach ──────────────────────────────────────────
create table if not exists public.coach_questions (
  id bigint generated always as identity primary key,
  student_no int not null references public.student_numbers(number) on delete cascade,
  at timestamptz not null default now(),
  question text not null,
  answer text,
  -- Filled in by the insights agent: what the question was about.
  topic text
);
create index if not exists coach_questions_student on public.coach_questions (student_no, at);
alter table public.coach_questions enable row level security;

-- ── Feature reactions (🔥 / 👇) ───────────────────────────────────────
create table if not exists public.feature_reactions (
  id bigint generated always as identity primary key,
  student_no int not null references public.student_numbers(number) on delete cascade,
  at timestamptz not null default now(),
  feature text not null,
  reaction text not null check (reaction in ('love','dislike')),
  note text
);
alter table public.feature_reactions enable row level security;

-- ── Usage ─────────────────────────────────────────────────────────────
-- Every view, every stretch of time on a page, every tour step.
create table if not exists public.events (
  id bigint generated always as identity primary key,
  student_no int not null references public.student_numbers(number) on delete cascade,
  at timestamptz not null default now(),
  type text not null,
  area text,
  seconds int,
  data jsonb not null default '{}'::jsonb
);
create index if not exists events_type_at on public.events (type, at);
create index if not exists events_student on public.events (student_no, at);
alter table public.events enable row level security;

-- ── Check-ins ─────────────────────────────────────────────────────────
-- The student's own measure (components/check-in.tsx): confidence at the
-- start and the end, how likely they are to recommend it, and what
-- changed - quotable only if they said so, never with a name.
create table if not exists public.check_ins (
  id bigint generated always as identity primary key,
  student_no int not null references public.student_numbers(number) on delete cascade,
  at timestamptz not null default now(),
  moment text not null check (moment in ('start','end')),
  confidence int check (confidence between 1 and 10),
  recommend int check (recommend between 0 and 10),
  story text,
  quote_ok boolean not null default false
);
alter table public.check_ins enable row level security;

-- ── Money ─────────────────────────────────────────────────────────────
-- One row per payment, refund and upgrade, written by the Stripe webhook
-- with the service key - the data room's revenue, refunds and mix.
create table if not exists public.payments (
  id bigint generated always as identity primary key,
  student_no int references public.student_numbers(number) on delete set null,
  at timestamptz not null default now(),
  kind text not null check (kind in ('purchase','upgrade','monthly','refund')),
  tier text,
  amount_cents int not null,
  cohort text,
  stripe_id text unique
);
alter table public.payments enable row level security;

-- ── Insights ──────────────────────────────────────────────────────────
-- What the insights agent concludes each week, kept so the trend of its
-- own conclusions can be read back.
create table if not exists public.insight_reports (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  period_start date not null,
  period_end date not null,
  -- { headline, findings: [{ title, detail, evidence, suggestion }] }
  report jsonb not null
);
alter table public.insight_reports enable row level security;

-- ── How students write ────────────────────────────────────────────────
-- The only doors in. Each takes the student's number from their login,
-- so a student can add their own rows and nothing else.

create or replace function public.log_training_take(
  p_challenge text, p_level text, p_duration int, p_transcript text,
  p_review jsonb, p_score int, p_passed boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare n int := my_student_number(); new_id uuid;
begin
  if n is null then return null; end if;
  insert into training_takes (student_no, challenge_slug, level, duration_sec, transcript, review, score, passed)
  values (n, p_challenge, p_level, p_duration, p_transcript, p_review, p_score, p_passed)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.rate_training_take(p_id uuid, p_rating text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update training_takes set rating = p_rating, rating_note = coalesce(p_note, rating_note)
  where id = p_id and student_no = my_student_number();
end;
$$;

create or replace function public.log_coach_question(p_question text, p_answer text)
returns void language plpgsql security definer set search_path = public as $$
declare n int := my_student_number();
begin
  if n is null then return; end if;
  insert into coach_questions (student_no, question, answer) values (n, p_question, p_answer);
end;
$$;

create or replace function public.log_feature_reaction(p_feature text, p_reaction text, p_note text)
returns void language plpgsql security definer set search_path = public as $$
declare n int := my_student_number();
begin
  if n is null then return; end if;
  insert into feature_reactions (student_no, feature, reaction, note) values (n, p_feature, p_reaction, p_note);
end;
$$;

create or replace function public.log_check_in(p_moment text, p_confidence int, p_recommend int, p_story text, p_quote_ok boolean)
returns void language plpgsql security definer set search_path = public as $$
declare n int := my_student_number();
begin
  if n is null then return; end if;
  insert into check_ins (student_no, moment, confidence, recommend, story, quote_ok)
  values (n, p_moment, p_confidence, p_recommend, p_story, coalesce(p_quote_ok, false));
end;
$$;

-- Events arrive in batches from the device's queue.
create or replace function public.log_events(p_events jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare n int := my_student_number();
begin
  if n is null then return; end if;
  insert into events (student_no, at, type, area, seconds, data)
  select n, coalesce((e->>'at')::timestamptz, now()), e->>'type', e->>'area', (e->>'seconds')::int, e
  from jsonb_array_elements(p_events) as e;
end;
$$;

grant execute on function public.my_student_number, public.log_training_take, public.rate_training_take,
  public.log_coach_question, public.log_feature_reaction, public.log_check_in, public.log_events to authenticated;
