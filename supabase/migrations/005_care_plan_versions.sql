-- Versioned AI Care Companion plans (never overwrite history)
alter table public.care_plans
  add column if not exists discharge_id uuid,
  add column if not exists version int not null default 1,
  add column if not exists warning_signs jsonb not null default '[]'::jsonb,
  add column if not exists next_steps jsonb not null default '[]'::jsonb,
  add column if not exists daily_schedule jsonb,
  add column if not exists doctor_review_notes text,
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists care_plans_patient_version_idx
  on public.care_plans (patient_id, version desc);

create index if not exists care_plans_patient_status_idx
  on public.care_plans (patient_id, status);

comment on table public.care_plans is
  'AI-organized recovery plans derived from doctor discharge summaries. Versioned; approve to activate.';
