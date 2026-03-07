# Payment Flow (Pending -> Webhook -> Confirmed)

## Core Flow
1. Customer checkout.
2. Backend creates `Order` with `status=pending_payment`, `payment_status=unpaid`.
3. Backend reserves stock in `StockReservation` with `status=ACTIVE`, TTL (`expires_at`).
4. Backend creates `Payment` with `status=PENDING`, TTL (`expires_at`).
5. Customer is redirected to payment gateway (VNPay).
6. Customer returns to frontend `/payment-result`; frontend shows pending confirmation and polls status.
7. Gateway webhook/IPN updates payment status.
8. In one DB transaction:
   - lock payment row and update `PENDING -> PAID`
   - lock order row and update `pending_payment -> confirmed`, `payment_status=paid`
   - confirm reservation `ACTIVE -> CONFIRMED`
   - insert outbox event (`ORDER_CONFIRMED`)
9. Worker processes outbox event to send email/notification.

## Reconcile & Drift Handling
- Reconcile job expires old reservations: `ACTIVE -> EXPIRED`, returns stock.
- Reconcile job expires old payments: `PENDING -> FAILED`.
- If an order has no `PENDING/PAID` payments left, reconcile can cancel pending order and release reservation.
- Reconcile job repairs paid-state drift: if payment is `PAID` but order is not confirmed/paid, it replays confirmation logic.

## Idempotency Rules
- `markPaymentPaid` accepts repeated callbacks safely (`PENDING` and `PAID` paths).
- Outbox insertion uses dedupe by `(aggregate_type, aggregate_id, event_type)`.
- Outbox worker can reclaim stale `PROCESSING` events after timeout.

## Recommended Operational Extensions
- Add gateway event table (`payment_webhook_logs`) for audit and replay.
- Add provider query API in reconcile for "paid but webhook missed".
- Add alerting for:
  - high count of expired reservations/payments
  - outbox `FAILED` backlog
  - callback signature errors
