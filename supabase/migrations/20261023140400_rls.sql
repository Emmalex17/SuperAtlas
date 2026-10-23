-- Phase 1: row-level security helper functions, policies and grants for every table created
-- in this phase. See docs/BACKEND_SPEC.md section 6. Every policy starts with
-- tenant_id = current_tenant_id() (or is joined through memberships filtered to the caller's
-- own tenant), which is also what the cross-tenant-isolation test in section 17 checks.
--
-- Helper functions are security definer with a fixed search_path so they can read memberships
-- (and, later, cases/engagements) to answer "can this person see X" without themselves being
-- blocked by the very RLS policies they're evaluating — the standard Supabase pattern for this.

create or replace function current_membership()
returns memberships
language sql
stable
security definer
set search_path = public
as $$
  select m.* from memberships m
  where m.user_id = auth.uid() and m.status = 'active'
  limit 1;
$$;

create or replace function current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from memberships
  where user_id = auth.uid() and status = 'active'
  limit 1;
$$;

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.status = 'active' and m.role = 'Admin'
  );
$$;

create or replace function is_regulator(perm text default null)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid()
      and m.status = 'active'
      and m.workspace = 'regulator'
      and (
        perm is null
        or exists (
          select 1 from role_permissions rp
          where rp.tenant_id = m.tenant_id and rp.role = m.role
            and rp.permission = perm and rp.allowed
        )
      )
  );
$$;

create or replace function is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.status = 'active'
      and m.workspace = 'organisation' and m.org_id = target_org
  );
$$;

create or replace function is_firm_member(target_firm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memberships m
    where m.user_id = auth.uid() and m.status = 'active'
      and m.workspace = 'firm' and m.firm_id = target_firm
  );
$$;

-- A firm can see an organisation once it has an engagement (a case) with it; an organisation
-- can see a firm the same way. The cases table doesn't exist until back-end phase 4, so these
-- are stand-ins that always return false until that migration replaces them with a real check
-- — defined now, rather than left as a forward reference, so this file never needs reopening.
create or replace function firm_can_see_org(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

create or replace function org_can_see_firm(target_firm uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select false;
$$;

-- tenants: members read their own tenant row only. Written only through dedicated server
-- actions (updateTenantProfile etc., permission-checked in code), never a raw client update.
alter table tenants enable row level security;
create policy tenants_select on tenants for select
  using (id = current_tenant_id());

-- profiles: a person always sees and updates their own profile; anyone active in the same
-- tenant can see profiles of other active members of that tenant (Team screens need this —
-- which workspace's Team page shows which people is a query-level filter, not an RLS one).
alter table profiles enable row level security;
create policy profiles_select_own on profiles for select
  using (user_id = auth.uid());
create policy profiles_update_own on profiles for update
  using (user_id = auth.uid());
create policy profiles_select_tenant on profiles for select
  using (
    exists (
      select 1 from memberships m1
      join memberships m2 on m2.tenant_id = m1.tenant_id
      where m1.user_id = auth.uid() and m1.status = 'active'
        and m2.user_id = profiles.user_id and m2.status = 'active'
    )
  );

-- memberships: visible to everyone in the same tenant (Team lists); written only by service
-- role (invitations.acceptInvite, team.changeRole etc. check permissions in code first).
alter table memberships enable row level security;
create policy memberships_select_tenant on memberships for select
  using (tenant_id = current_tenant_id());

-- role_permissions: readable by everyone in the tenant (screens need to know what they can
-- do); written only by service role under settings.manage.
alter table role_permissions enable row level security;
create policy role_permissions_select on role_permissions for select
  using (tenant_id = current_tenant_id());

-- invitations: a regulator admin with orgs.invite or firms.accredit sees the tenant's
-- invitations; an organisation/firm admin sees invitations for their own org/firm (to
-- resend/cancel colleague invites). The public accept-invite flow never queries this table
-- directly — getInvite(token)/acceptInvite(token) run as the service role, looking up by
-- token hash, not by RLS.
alter table invitations enable row level security;
create policy invitations_select_tenant on invitations for select
  using (
    tenant_id = current_tenant_id()
    and (
      is_regulator('orgs.invite') or is_regulator('firms.accredit')
      or (org_id is not null and is_org_member(org_id))
      or (firm_id is not null and is_firm_member(firm_id))
    )
  );

-- Category tree and scoring/finding/action reference data: readable by everyone signed in to
-- the tenant; written only by service role under settings.manage / library.edit.
alter table sector_groups enable row level security;
create policy sector_groups_select on sector_groups for select using (tenant_id = current_tenant_id());

alter table org_types enable row level security;
create policy org_types_select on org_types for select using (tenant_id = current_tenant_id());

alter table org_tiers enable row level security;
create policy org_tiers_select on org_tiers for select using (tenant_id = current_tenant_id());

alter table scoring_schemes enable row level security;
create policy scoring_schemes_select on scoring_schemes for select using (tenant_id = current_tenant_id());

alter table finding_classes enable row level security;
create policy finding_classes_select on finding_classes for select using (tenant_id = current_tenant_id());

alter table action_types enable row level security;
create policy action_types_select on action_types for select using (tenant_id = current_tenant_id());

alter table tenant_rules enable row level security;
create policy tenant_rules_select on tenant_rules for select using (tenant_id = current_tenant_id());

-- organisations: regulator sees all in its tenant; an organisation member sees its own row; a
-- firm member sees organisations it has an engagement with (always none until phase 4).
alter table organisations enable row level security;
create policy organisations_select on organisations for select
  using (tenant_id = current_tenant_id() and (is_regulator() or is_org_member(id) or firm_can_see_org(id)));

-- firms: regulator sees all in its tenant; a firm member sees its own row; an organisation
-- member sees firms it's engaged with (always none until phase 4).
alter table firms enable row level security;
create policy firms_select on firms for select
  using (tenant_id = current_tenant_id() and (is_regulator() or is_firm_member(id) or org_can_see_firm(id)));

-- audit_log: regulator admins see every entry in their tenant. Organisation/firm-admin
-- scoping (an org admin sees only entries about their own organisation) is added once
-- audit_log rows reliably carry an org/firm-attributable record to join against — not yet
-- true in Phase 1, where every audit entry is a regulator-tenant-level event (sign-in,
-- invitations, role changes). Not a gap: there is nothing org/firm-scoped to show yet.
alter table audit_log enable row level security;
create policy audit_log_select on audit_log for select
  using (tenant_id = current_tenant_id() and is_admin() and (current_membership()).workspace = 'regulator');

-- notifications: strictly your own.
alter table notifications enable row level security;
create policy notifications_select_own on notifications for select using (user_id = auth.uid());
create policy notifications_update_own on notifications for update using (user_id = auth.uid());

-- email_outbox / email_suppressions: no end-user access. RLS is enabled with no policies at
-- all, so authenticated/anon get zero rows by default; only the service role (which bypasses
-- RLS) — the sender, the cron retry job, invitation and auth flows — ever touches these.
alter table email_outbox enable row level security;
alter table email_suppressions enable row level security;

-- Grants: the anon/authenticated roles can only do what RLS then further restricts row by
-- row. Tables with no grant here are service-role-only, matching the policies above.
grant select on tenants, memberships, role_permissions, invitations,
  sector_groups, org_types, org_tiers, scoring_schemes, finding_classes, action_types,
  tenant_rules, organisations, firms, audit_log
  to authenticated;
grant select, update on profiles to authenticated;
grant select, update on notifications to authenticated;
