-- 003_payment_events.up.sql
-- Payment events table for Stripe webhook audit trail + idempotency.

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(20) NOT NULL DEFAULT 'stripe',
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255),
    intent_id VARCHAR(255),
    refund_id VARCHAR(255),
    order_id UUID REFERENCES orders(id),
    payment_status VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency: unique constraint on provider + event_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_events_provider_event_id
    ON payment_events(provider, event_id)
    WHERE event_id IS NOT NULL AND BTRIM(event_id) <> '';

CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_intent_id ON payment_events(intent_id);
