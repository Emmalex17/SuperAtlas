-- Phase 1 close-out: a general-purpose rate-limit ledger (spec section 18: "rate limits on
-- sign-in, code resend, password reset, invite accept and search (per IP and per account,
-- stored in Postgres)"). Sign-in's own lockout already has a dedicated table
-- (auth_attempts, 20261023150000) because it needs a slightly different shape (success
-- boolean, counted per email). This table covers every other rate-limited action: one row per
-- attempt, keyed by an arbitrary (action, key) pair the caller chooses — key is an email, an
-- IP, or "<ip>:<email>", whatever that action's rule needs.

create table rate_limits (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  key text not null,
  at timestamptz not null default now()
);
create index rate_limits_action_key_idx on rate_limits (action, key, at desc);

-- Service-role only, same as auth_attempts.
alter table rate_limits enable row level security;

-- Unbounded growth is fine at pilot scale (one row per attempt, cheap and narrow), but give
-- future cleanup a natural cutoff: nothing here is ever read past a 24-hour window by any
-- caller, so a scheduled "delete where at < now() - interval '1 day'" is always safe to add
-- later without checking call sites first.
