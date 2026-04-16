-- 002_keycloak_settings_fixes.up.sql
-- Keycloak integration, settings table (Option B pricing), schema fixes.

-- ── Users: add keycloak_user_id, soft delete ────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_user_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_keycloak_user_id
    ON users(keycloak_user_id) WHERE keycloak_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;

-- ── Addresses: add updated_at, index ────────────────────────────────
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);

-- ── Categories: add updated_at, deleted_at ──────────────────────────
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_categories_deleted_at ON categories(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ── Products: add deleted_at ────────────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_products_deleted_at ON products(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured) WHERE is_featured = true;

-- ── Orders: add deleted_at, delivery address ────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_street VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_city VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_postal_code VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_first_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_last_name VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ── Order Prestations (join table) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS order_prestations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES prestation_bookings(id),
    price BIGINT NOT NULL
);

-- ── Prestation Bookings: add user_id ────────────────────────────────
ALTER TABLE prestation_bookings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_prestation_bookings_user_id ON prestation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_prestation_bookings_order_id ON prestation_bookings(order_id);
CREATE INDEX IF NOT EXISTS idx_prestation_bookings_slot_id ON prestation_bookings(slot_id);

-- ── Refresh Tokens: index on token_hash ─────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);

-- ── Email Logs ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    "to" VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    template VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'sent',
    error TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);

-- ── Settings (key-value, JSON values) ───────────────────────────────
-- Generic settings table. The cheffe configures prestation pricing here.
CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default prestation pricing (Option B: base + per person)
INSERT INTO settings (key, value) VALUES
    ('prestation_pricing', '{
        "base_price": 5000,
        "price_per_person": 1500,
        "min_guests": 2,
        "max_guests": 12
    }'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ── Contact messages ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(200),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
