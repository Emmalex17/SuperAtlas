-- Phase 1: schedule the 5-minute email-outbox retry job via Supabase pg_cron + pg_net, since
-- Vercel Cron on the Hobby plan runs at most once a day per job (docs/RECONCILIATION.md
-- section 6) — spec section 16's documented fallback for exactly this case. Vercel Cron still
-- handles the one daily job (vercel.json, /api/cron/daily).
--
-- The CRON_SECRET value itself is never written to a migration file (rule 2). This job reads
-- it from Supabase Vault at call time; the secret is inserted into the vault separately, once,
-- directly against the database — not from committed SQL. If the vault row is ever missing,
-- the job simply calls the endpoint with a blank bearer token, which /api/cron/email correctly
-- rejects with 401 rather than silently skipping auth.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select
  cron.schedule(
    'process-email-outbox',
    '*/5 * * * *',
    $$
    select net.http_get(
      url := 'https://superatlas-green.vercel.app/api/cron/email',
      headers := jsonb_build_object(
        'Authorization',
        'Bearer ' || coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1), '')
      )
    );
    $$
  )
where not exists (select 1 from cron.job where jobname = 'process-email-outbox');
