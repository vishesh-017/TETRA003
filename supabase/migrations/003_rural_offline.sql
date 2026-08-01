-- Rural field sync targets (checkins already in 001; alerts for emergency escalation)

comment on table public.alerts is
  'Includes rural_emergency alerts created when field screenings sync.';

-- Optional: track rural capture source on checkins via notes marker [rural:<id>]
-- No schema change required for demo sync into existing checkins / alerts / notifications.
