-- ═══════════════════════════════════════════════════════════════
-- FITFORGE SQL DATABASE SCHEMA MIGRATION
-- ═══════════════════════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ──────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  age integer,
  sex text,
  height_cm numeric,
  weight_kg numeric,
  experience_level text,
  goal text,
  equipment text,
  days_per_week integer,
  session_minutes integer,
  injuries text,
  target_calories integer,
  target_protein integer,
  target_carbs integer,
  target_fat integer,
  target_water integer,
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can insert their own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

create policy "Users can update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- ──────────────────────────────────────────────────────────────
-- 2. WORKOUT PLANS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.workout_plans (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  split_type text,
  schedule_type text,
  repeat_enabled boolean default true,
  duration_weeks integer default 12,
  start_date text,
  is_active boolean default false,
  created_at text not null
);

alter table public.workout_plans enable row level security;

create policy "Users can manage their own plans"
  on public.workout_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 3. PLAN DAYS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.plan_days (
  id text primary key,
  plan_id text not null references public.workout_plans(id) on delete cascade,
  day_code text not null,
  title text not null,
  focus text,
  order_index integer not null
);

alter table public.plan_days enable row level security;

create policy "Users can manage their own plan days"
  on public.plan_days for all
  using (
    exists (
      select 1 from public.workout_plans
      where public.workout_plans.id = public.plan_days.plan_id
      and public.workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans
      where public.workout_plans.id = public.plan_days.plan_id
      and public.workout_plans.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 4. PLAN EXERCISES
-- ──────────────────────────────────────────────────────────────
create table if not exists public.plan_exercises (
  id text primary key,
  plan_day_id text not null references public.plan_days(id) on delete cascade,
  exercise_name text not null,
  sets integer not null,
  rep_target integer not null,
  rep_min integer,
  rep_max integer,
  target_weight numeric,
  rest_seconds integer default 90,
  tracking_type text default 'weight_reps',
  notes text,
  exercise_order integer not null
);

alter table public.plan_exercises enable row level security;

create policy "Users can manage their own plan exercises"
  on public.plan_exercises for all
  using (
    exists (
      select 1 from public.plan_days
      join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
      where public.plan_days.id = public.plan_exercises.plan_day_id
      and public.workout_plans.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.plan_days
      join public.workout_plans on public.workout_plans.id = public.plan_days.plan_id
      where public.plan_days.id = public.plan_exercises.plan_day_id
      and public.workout_plans.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 5. WORKOUT SESSIONS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.workout_sessions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text,
  plan_day_id text,
  plan_day_title text,
  scheduled_date text not null,
  started_at text not null,
  completed_at text,
  status text not null,
  mood_rating integer,
  soreness_areas text[],
  duration_seconds integer,
  notes text
);

alter table public.workout_sessions enable row level security;

create policy "Users can manage their own sessions"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 6. EXERCISE LOGS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.exercise_logs (
  id text primary key,
  session_id text not null references public.workout_sessions(id) on delete cascade,
  exercise_name text not null,
  exercise_order integer not null,
  planned_sets integer not null,
  planned_reps integer not null
);

alter table public.exercise_logs enable row level security;

create policy "Users can manage their own exercise logs"
  on public.exercise_logs for all
  using (
    exists (
      select 1 from public.workout_sessions
      where public.workout_sessions.id = public.exercise_logs.session_id
      and public.workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions
      where public.workout_sessions.id = public.exercise_logs.session_id
      and public.workout_sessions.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 7. SET LOGS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.set_logs (
  id text primary key,
  exercise_log_id text not null references public.exercise_logs(id) on delete cascade,
  set_number integer not null,
  planned_weight numeric,
  actual_weight numeric not null,
  planned_reps integer not null,
  actual_reps integer not null,
  rpe integer,
  completed boolean default false,
  note text
);

alter table public.set_logs enable row level security;

create policy "Users can manage their own set logs"
  on public.set_logs for all
  using (
    exists (
      select 1 from public.exercise_logs
      join public.workout_sessions on public.workout_sessions.id = public.exercise_logs.session_id
      where public.exercise_logs.id = public.set_logs.exercise_log_id
      and public.workout_sessions.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.exercise_logs
      join public.workout_sessions on public.workout_sessions.id = public.exercise_logs.session_id
      where public.exercise_logs.id = public.set_logs.exercise_log_id
      and public.workout_sessions.user_id = auth.uid()
    )
  );

-- ──────────────────────────────────────────────────────────────
-- 8. NUTRITION LOGS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.nutrition_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_name text not null,
  calories integer not null,
  protein integer not null,
  carbs integer not null,
  fat integer not null,
  logged_at text not null
);

alter table public.nutrition_logs enable row level security;

create policy "Users can manage their own nutrition logs"
  on public.nutrition_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 9. WATER LOGS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.water_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml integer not null,
  logged_at text not null
);

alter table public.water_logs enable row level security;

create policy "Users can manage their own water logs"
  on public.water_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ──────────────────────────────────────────────────────────────
-- 10. WEIGHT LOGS
-- ──────────────────────────────────────────────────────────────
create table if not exists public.weight_logs (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  weight numeric not null,
  body_fat numeric,
  logged_at text not null
);

alter table public.weight_logs enable row level security;

create policy "Users can manage their own weight logs"
  on public.weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
