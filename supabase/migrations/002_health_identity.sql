-- Digital Health Identity — ABDM-compatible records + government profile (demo-ready)

create table if not exists public.health_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  category text not null check (
    category in (
      'prescription',
      'lab_report',
      'allergy',
      'chronic_disease',
      'vaccination',
      'hospital_visit',
      'doctor_note'
    )
  ),
  title text not null,
  summary text not null default '',
  recorded_at timestamptz not null default now(),
  source text not null default 'local' check (source in ('abha_demo', 'local', 'manual', 'abdm')),
  facility text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists health_records_patient_idx
  on public.health_records (patient_id, recorded_at desc);

create table if not exists public.government_profiles (
  patient_id uuid primary key references public.patients (id) on delete cascade,
  abha_id text,
  abha_linked boolean not null default false,
  abha_linked_at timestamptz,
  pmjay_status text not null default 'unknown',
  pmjay_confidence numeric not null default 0,
  pmjay_answers jsonb not null default '{}'::jsonb,
  pmjay_assessed_at timestamptz,
  linked_record_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.health_records enable row level security;
alter table public.government_profiles enable row level security;
