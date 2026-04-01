# Billing foundation

This module provides Stripe-backed subscription lifecycle sync, plan entitlements, and reusable quota enforcement.

## Models

- `BillingPlan`: purchasable plans (`free`, `pro`, `agency`) and Stripe product/price references.
- `BillingEntitlement`: normalized feature flags and numeric limits by plan.
- `BillingCustomer`: provider customer identity per organization.
- `OrganizationSubscription`: org billing status + current period state.
- `UsageCounter`: lightweight counters for quota checks (`messages.sent.month`, etc.).
- `BillingEventLog`: webhook event idempotency + debugging history.

## Endpoints

- `GET /api/v1/billing/plans` - active plans and public entitlements.
- `GET /api/v1/billing/me` - current org billing snapshot (plan, status, entitlements, usage).
- `POST /api/v1/billing/checkout-session` - creates Stripe Checkout session.
- `POST /api/v1/billing/portal-session` - creates Stripe Billing Portal session.
- `POST /api/v1/billing/webhooks/stripe` - Stripe webhook ingestion endpoint.

## Webhook flow

1. Validate Stripe signature.
2. Upsert `BillingEventLog` for provider event idempotency.
3. Handle subscription/payment event types.
4. Sync `OrganizationSubscription` and related billing state.
5. Mark event processed.

## Quota model

`QuotaEnforcementService` centralizes:

- `assertFeatureEnabled(orgId, entitlementCode)`
- `assertBelowLimit(orgId, entitlementCode, currentValue)`
- `incrementUsageCounter(orgId, code, periodKey, delta)`
- `getUsageSnapshot(orgId)`

Initial enforcement points:

- devices (`devices.max`)
- contacts/import (`contacts.max`, `imports.enabled`)
- campaigns (`campaigns.active.max`)
- outbound generation (`messages.monthly.max`)
- templates (`templates.max`)
- operations UI/API (`operations.read` entitlement — RBAC `operations.read` is still required; entitlement gates product tier)

`BillingAccessService` blocks **outbound messaging** (message generation + worker dispatch) when subscription status is
`UNPAID`, `CANCELLED`, `INCOMPLETE`, `INCOMPLETE_EXPIRED`, or `PAUSED`. There is no subscription row only on unmigrated legacy orgs — new orgs get a subscription row from registration + free plan seed.

## Audit actions

Persisted on `AuditLog` for billing and quota transitions:

- `BILLING_CHECKOUT_SESSION_CREATED`, `BILLING_PORTAL_SESSION_CREATED`
- `BILLING_SUBSCRIPTION_ACTIVATED`, `BILLING_SUBSCRIPTION_UPDATED`, `BILLING_SUBSCRIPTION_CANCELLED`, `BILLING_PAYMENT_FAILED`
- `BILLING_QUOTA_LIMIT_REACHED`, `BILLING_ENTITLEMENT_DENIED`

## Guards / reuse

- Use `QuotaEnforcementService` for limits and boolean features.
- Use `BillingAccessService` for subscription-state gates on send pipelines.
- Optional Nest `Guard`/`Interceptor` wrappers can delegate to these services (foundation is service-first to avoid scattering Stripe types).

## Status behavior

- `ACTIVE` / `TRIALING`: full access by plan entitlements.
- `PAST_DUE`: outbound messaging still allowed (grace); monitor via Stripe/webhooks.
- `UNPAID` / `CANCELLED` / `INCOMPLETE_EXPIRED` / `INCOMPLETE` / `PAUSED`: outbound messaging blocked by `BillingAccessService`.
