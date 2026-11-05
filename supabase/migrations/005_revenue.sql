-- ============================================================================
-- CraveMap — Migration 005: Revenue evidence (lightweight)
-- ============================================================================
-- Migration 003 created merchant_payments with owner-SELECT only (assuming
-- payment provider webhooks write rows via service role).
--
-- For the hackathon revenue-evidence flow, we let the owner ALSO insert their
-- own payment rows directly — this powers two paths:
--
--   1. "Record manual payment" — used in dev/admin to log a pilot sale
--      without standing up Stripe webhooks.
--   2. Post-Stripe-redirect "mark as recorded" — after the merchant pays via
--      a Stripe Payment Link, they can self-report in-app so the Revenue
--      Dashboard reflects it. Stripe Dashboard remains the upstream truth.
--
-- No sensitive card data is ever stored. We only persist:
--   - amount_cents, currency
--   - payment_provider ('stripe' | 'manual')
--   - payment_status (always 'succeeded' on insert from client)
--   - product_name, optional external_payment_id (Stripe checkout session)
--
-- When this app graduates to real Stripe webhooks, drop this policy and let
-- the service role handle inserts.
-- ============================================================================

drop policy if exists payments_owner_insert on public.merchant_payments;
create policy payments_owner_insert on public.merchant_payments
  for insert with check (
    exists (
      select 1 from public.merchant_profiles m
      where m.id = merchant_payments.merchant_id and m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- End of migration 005
-- ============================================================================
