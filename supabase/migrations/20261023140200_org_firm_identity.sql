-- Phase 1: minimal organisation/firm identity — just enough for memberships to reference and
-- for the sidebar/dashboards to show a name, since five of the six demo accounts belong to an
-- organisation or firm. Back-end phase 2 (UI parity P3) adds the full profile columns from
-- docs/BACKEND_SPEC.md section 9.2 (rc_number, website, sector_group_id/type_id/tier_id,
-- officers, accreditations, advisory clients, classification requests, and so on) with
-- additive ALTER TABLE statements — never by editing this migration.

create table organisations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  short_name text,
  initials text,
  colour text,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger organisations_set_updated_at before update on organisations
  for each row execute function set_updated_at();
create index organisations_tenant_idx on organisations (tenant_id);

create table firms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  initials text,
  colour text,
  -- Exact words as spec'd (docs/BACKEND_SPEC.md section 9.2) — these are the words on screen,
  -- including the capitalisation, per rule 9.
  status text not null default 'invited' check (status in ('invited', 'Accredited', 'Renewal due', 'Suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger firms_set_updated_at before update on firms
  for each row execute function set_updated_at();
create index firms_tenant_idx on firms (tenant_id);

-- Now that organisations/firms exist, tighten the columns added in platform_core.sql with
-- real foreign keys.
alter table memberships
  add constraint memberships_org_fk foreign key (org_id) references organisations(id) on delete cascade,
  add constraint memberships_firm_fk foreign key (firm_id) references firms(id) on delete cascade;

alter table invitations
  add constraint invitations_org_fk foreign key (org_id) references organisations(id) on delete cascade,
  add constraint invitations_firm_fk foreign key (firm_id) references firms(id) on delete cascade;
