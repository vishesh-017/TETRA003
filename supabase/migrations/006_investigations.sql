-- Investigation Compliance workflow
create table if not exists public.investigations (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  discharge_id uuid,
  name text not null,
  purpose text,
  due_date date not null,
  priority text not null default 'routine'
    check (priority in ('routine', 'important', 'urgent')),
  notes text,
  status text not null default 'pending'
    check (status in ('pending', 'scheduled', 'completed', 'overdue', 'cancelled', 'review_required')),
  preparation text,
  completed_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  attachment_url text,
  attachment_name text,
  attachment_mime text,
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists investigations_patient_idx
  on public.investigations (patient_id, status, due_date);

create index if not exists investigations_doctor_idx
  on public.investigations (doctor_id, status, due_date);

-- Optional storage bucket for report uploads (create in dashboard if needed):
-- investigation-reports

comment on table public.investigations is
  'Post-discharge diagnostic investigations. AI never interprets results.';
