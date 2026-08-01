-- HealNexus patient-first schema (run in Supabase SQL editor)
-- Frontend talks to these tables directly via anon key + RLS.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null,
  phone text,
  role text not null check (role in ('doctor','patient','caregiver','health_worker')),
  locale text not null default 'en',
  address jsonb,
  notification_prefs jsonb not null default '{"medicine":true,"appointment":true,"tips":true,"doctor_messages":true}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  specialty text,
  hospital_affiliation text
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  date_of_birth date,
  sex text,
  blood_group text,
  abha_id_demo text,
  address jsonb,
  chronic_diseases text[] not null default '{}',
  allergies text[] not null default '{}',
  medical_history text,
  emergency_contact jsonb,
  caregiver_info jsonb,
  preferred_language text not null default 'en',
  status text not null default 'active',
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_passports (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  qr_token text not null,
  abha_id_demo text,
  allergies text[] not null default '{}',
  medical_history text,
  emergency_contacts jsonb,
  current_medicines jsonb,
  blood_group text
);

create table if not exists public.care_relationships (
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  status text not null default 'active',
  primary key (doctor_id, patient_id)
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  status text not null,
  caregiver_instructions text,
  patient_friendly_instructions text,
  ai_summary text,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.care_tasks (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  care_plan_id uuid references public.care_plans(id) on delete set null,
  title text not null,
  description text,
  period text not null check (period in ('morning','afternoon','evening','night')),
  sort_order int not null default 0,
  active boolean not null default true
);

create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  task_id uuid not null references public.care_tasks(id) on delete cascade,
  date date not null,
  status text not null check (status in ('pending','completed','skipped')),
  updated_at timestamptz not null default now(),
  unique (patient_id, task_id, date)
);

create table if not exists public.medicines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  care_plan_id uuid references public.care_plans(id) on delete set null,
  name text not null,
  dose text,
  frequency text,
  time_slots text[] not null default '{}',
  instructions text,
  active boolean not null default true
);

create table if not exists public.medicine_events (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  medicine_id uuid references public.medicines(id) on delete set null,
  status text not null check (status in ('taken','skipped','missed')),
  scheduled_for timestamptz,
  acted_at timestamptz not null default now(),
  date date not null
);

create table if not exists public.health_checkins (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  recorded_at timestamptz not null default now(),
  bp_systolic numeric,
  bp_diastolic numeric,
  blood_sugar numeric,
  temperature numeric,
  weight numeric,
  oxygen numeric,
  symptoms text[] not null default '{}',
  pain_score int,
  mood text,
  sleep_hours numeric,
  water_intake numeric,
  exercise text,
  medicine_taken boolean,
  notes text
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  doctor_name text not null,
  scheduled_at timestamptz not null,
  location text,
  status text not null,
  appointment_type text not null default 'follow_up',
  notes text
);

create table if not exists public.recovery_scores (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  score numeric not null,
  computed_at timestamptz not null default now()
);

create table if not exists public.risk_scores (
  patient_id uuid primary key references public.patients(id) on delete cascade,
  score numeric not null,
  level text not null,
  computed_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.task_completions enable row level security;
alter table public.medicine_events enable row level security;
alter table public.health_checkins enable row level security;
alter table public.notifications enable row level security;
alter table public.appointments enable row level security;

-- Patients can read/update their own profile + related rows
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "patients_self_select" on public.patients
  for select using (auth.uid() = user_id);

create policy "patients_self_update" on public.patients
  for update using (auth.uid() = user_id);

create policy "task_completions_self" on public.task_completions
  for all using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );

create policy "medicine_events_self" on public.medicine_events
  for all using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );

create policy "checkins_self" on public.health_checkins
  for all using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );

create policy "notifications_self" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "appointments_self_select" on public.appointments
  for select using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );

create policy "appointments_self_update" on public.appointments
  for update using (
    exists (select 1 from public.patients p where p.id = patient_id and p.user_id = auth.uid())
  );
