# SuperAtlas back-end changelog

One entry per phase (`docs/BACKEND_SPEC.md` section 15), newest first. Each entry records what was built, actions added, migrations, screens switched to live data, and parity/test results, per the definition-of-done in section 17.

## Step 0 and Step 0.5 — 23 Oct 2026

**Step 0 (credential verification):** all 17 items checked; full pass/fail table recorded in the session log and summarised in `docs/RECONCILIATION.md` section 7. Notable outcomes:
- Brevo API key, SMTP credentials, sender identity all verified working (test email sent and received).
- Supabase Auth configured with Brevo custom SMTP, 6-digit/10-minute OTP, public sign-ups off, site URL and redirect allow-list set.
- Database password reset and both `DATABASE_URL` (pooled) and `DIRECT_URL` (direct) confirmed with `select 1`.
- `CRON_SECRET` and the six `DEMO_PASSWORD_*` values generated.
- `AI_PROVIDER=demo` set.
- One deliberate, documented gap: `EMAIL_FROM_ADDRESS` is sender-verified only, not domain-verified (no SPF/DKIM) — operator's choice for the pilot after DNS setup issues. Logged, not silently accepted.
- Vercel confirmed on the Hobby plan, which changes how cron jobs are scheduled (`docs/RECONCILIATION.md` section 6).

**Step 0.5 (repository check):** `docs/RECONCILIATION.md` written — stack, current Supabase usage (none), route-to-mock-data mapping, env vars in use, lint/type-check/test/CI commands, and every difference from the spec's assumed layout with the decision taken for each.

---

*Phase 1 entry starts below as it is built.*
