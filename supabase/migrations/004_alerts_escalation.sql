-- Escalation alerts created by the check-in → health intelligence pipeline.

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  alert_type text not null,
  severity text not null,
  title text not null,
  body text not null,
  reason text not null default '',
  status text not null default 'open',
  assigned_doctor_id uuid references public.doctors(id) on delete set null,
  checkin_id uuid,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists alerts_patient_created_idx
  on public.alerts (patient_id, created_at desc);

create index if not exists alerts_status_severity_idx
  on public.alerts (status, severity);

alter table public.alerts enable row level security;

create policy "alerts_authenticated_select" on public.alerts
  for select to authenticated
  using (true);

create policy "alerts_authenticated_insert" on public.alerts
  for insert to authenticated
  with check (true);

create policy "alerts_authenticated_update" on public.alerts
  for update to authenticated
  using (true);

-- Realtime (safe if already members — run once on new projects)
do $$
begin
  begin
    alter publication supabase_realtime add table public.alerts;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.health_checkins;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.recovery_scores;
  exception when duplicate_object then null;
  end;
end $$;
