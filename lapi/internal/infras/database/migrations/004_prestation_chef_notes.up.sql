-- Feature 8: internal chef notes on bookings (invisible to client)
ALTER TABLE prestation_bookings
    ADD COLUMN IF NOT EXISTS chef_notes TEXT NOT NULL DEFAULT '';
