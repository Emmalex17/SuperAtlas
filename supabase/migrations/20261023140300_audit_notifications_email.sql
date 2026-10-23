-- Phase 1: audit log, in-app notifications, the email outbox and the suppression list.
-- See docs/BACKEND_SPEC.md sections 8, 9.1, 18.

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id),
  actor_name text not null,
  workspace text,
  action text not null,
  record_type text,
  record_id uuid,
  record_label text,
  detail jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  at timestamptz not null default now()
);
create index audit_log_tenant_idx on audit_log (tenant_id, at desc);
create index audit_log_record_idx on audit_log (tenant_id, record_type, record_id);

-- Insert-only: nobody, including table owners acting through the API roles, updates or
-- deletes an audit entry (section 9.1: "Insert-only: no update or delete grants").
revoke update, delete on audit_log from authenticated, anon;

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('Approvals', 'Updates', 'Reminders')),
  icon text,
  tone text,
  title text not null,
  body text,
  link_route text,
  link_arg text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on notifications (user_id, read_at, created_at desc);

create table email_outbox (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  to_email text not null,
  to_name text,
  template text not null,
  params jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'demo_suppressed')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  brevo_message_id text,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger email_outbox_set_updated_at before update on email_outbox
  for each row execute function set_updated_at();
create index email_outbox_pending_idx on email_outbox (status, next_attempt_at) where status = 'queued';
create index email_outbox_tenant_idx on email_outbox (tenant_id);

create table email_suppressions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null,
  reason text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);
