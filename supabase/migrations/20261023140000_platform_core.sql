-- Phase 1: platform core — tenants, profiles, memberships, role permissions, invitations.
-- See docs/BACKEND_SPEC.md sections 6, 7, 9.1.

create extension if not exists pgcrypto;

-- Shared trigger function for every updated_at column in this project.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_name text not null,
  legal_name text,
  is_demo boolean not null default false,
  mandate text,
  sectors text[] not null default '{}',
  email text,
  phone text,
  address text,
  branding jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger tenants_set_updated_at before update on tenants
  for each row execute function set_updated_at();

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  initials text,
  job_title text,
  phone text,
  avatar_path text,
  is_demo boolean not null default false,
  notification_prefs jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_set_updated_at before update on profiles
  for each row execute function set_updated_at();

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  workspace text not null check (workspace in ('regulator', 'organisation', 'firm')),
  -- org_id/firm_id are tightened with real foreign keys in 20261023140200_org_firm_identity.sql
  -- once the organisations/firms tables exist — additive, not a design gap. See that file.
  org_id uuid,
  firm_id uuid,
  role text not null,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended', 'removed')),
  invited_by uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_one_target check (
    (workspace = 'regulator' and org_id is null and firm_id is null) or
    (workspace = 'organisation' and org_id is not null and firm_id is null) or
    (workspace = 'firm' and firm_id is not null and org_id is null)
  )
);
create trigger memberships_set_updated_at before update on memberships
  for each row execute function set_updated_at();

-- Exactly one ACTIVE membership per user — an invited or removed row doesn't block a new one.
create unique index memberships_one_active_per_user on memberships (user_id) where status = 'active';
create index memberships_tenant_idx on memberships (tenant_id);
create index memberships_user_idx on memberships (user_id);
create index memberships_org_idx on memberships (org_id) where org_id is not null;
create index memberships_firm_idx on memberships (firm_id) where firm_id is not null;

create table role_permissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  role text not null,
  permission text not null,
  allowed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, role, permission)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  email text not null,
  workspace text not null check (workspace in ('regulator', 'organisation', 'firm')),
  org_id uuid,
  firm_id uuid,
  role text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  invited_by uuid references auth.users(id),
  accepted_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger invitations_set_updated_at before update on invitations
  for each row execute function set_updated_at();

create index invitations_tenant_idx on invitations (tenant_id);
create index invitations_email_idx on invitations (email);
create index invitations_status_idx on invitations (tenant_id, status);
