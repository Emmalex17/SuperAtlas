-- Phase 1: reference data the live-NITDA bootstrap loads (category tree, scoring schemes,
-- finding classes, action types) and tenant-level default rules. See docs/BACKEND_SPEC.md
-- sections 9.2, 9.3, 9.6 and 14.1. Full organisation/firm profile tables are added in
-- 20261023140200_org_firm_identity.sql and later phases — this file is reference/lookup data
-- only.

create table sector_groups (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create table org_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  sector_group_id uuid not null references sector_groups(id) on delete cascade,
  name text not null,
  plural_name text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, sector_group_id, name)
);

create table org_tiers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  org_type_id uuid not null references org_types(id) on delete cascade,
  name text not null,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, org_type_id, name)
);

create index org_types_sector_idx on org_types (sector_group_id);
create index org_tiers_type_idx on org_tiers (org_type_id);

create table scoring_schemes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  kind text not null,
  is_default boolean not null default false,
  levels jsonb not null default '[]'::jsonb,
  bands jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger scoring_schemes_set_updated_at before update on scoring_schemes
  for each row execute function set_updated_at();
create unique index scoring_schemes_one_default on scoring_schemes (tenant_id) where is_default;

create table finding_classes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  fix_days int not null default 0,
  tone text,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table action_types (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  key text not null,
  name text not null,
  description text,
  response_days int not null default 0,
  has_penalty boolean not null default false,
  level int not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create table tenant_rules (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  firm_renewal_months int not null default 12,
  firm_grace_days int not null default 30,
  conflict_months int not null default 24,
  compliance_benchmark_default int not null default 70,
  watch_overdue_days int,
  watch_cycles_running int not null default 2,
  watch_late_runs int not null default 3,
  updated_at timestamptz not null default now()
);
create trigger tenant_rules_set_updated_at before update on tenant_rules
  for each row execute function set_updated_at();
