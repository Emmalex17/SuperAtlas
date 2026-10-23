-- Phase 1: sign-in lockout tracking (spec section 18: "lockout after 5 failures in 15
-- minutes"). Deliberately a separate table from audit_log, not a reuse of it: a failed
-- password attempt often can't be tied to a tenant_id (we only learn who the person is, and
-- therefore which tenant, once the password is right) — audit_log.tenant_id is not null by
-- design, and should stay that way. This table exists purely to count recent failures by
-- email; it is not a record of who did what for compliance purposes, so it carries no
-- tenant_id and no actor identity beyond the email attempted.

create table auth_attempts (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  success boolean not null,
  at timestamptz not null default now()
);
create index auth_attempts_email_idx on auth_attempts (email, at desc);

-- Service-role only — no end-user ever reads or writes this directly.
alter table auth_attempts enable row level security;
