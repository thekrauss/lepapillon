package types

import "github.com/google/uuid"

// ── Intent ──────────────────────────────────────────────────────────

type CreateIntentRequest struct {
	OrderID uuid.UUID `json:"order_id" validate:"required"`
}

type IntentResponse struct {
	IntentID       string `json:"intent_id"`
	ClientSecret   string `json:"client_secret"`
	PublishableKey string `json:"publishable_key"`
	Status         string `json:"status"`
	Amount         int64  `json:"amount"`
	Currency       string `json:"currency"`
}

type IntentStatusResponse struct {
	IntentID string `json:"intent_id"`
	Status   string `json:"status"`
	Amount   int64  `json:"amount"`
}

// ── Webhook ─────────────────────────────────────────────────────────

type WebhookEvent struct {
	EventID       string `json:"event_id"`
	EventType     string `json:"event_type"`
	IntentID      string `json:"intent_id"`
	OrderID       string `json:"order_id"`
	PaymentStatus string `json:"payment_status"`
}

// ── Refund ───────────────────────────────────────────────────────────

type RefundRequest struct {
	OrderID uuid.UUID `json:"order_id" validate:"required"`
	Amount  *int64    `json:"amount"` // nil = full refund
	Reason  string    `json:"reason"`
}

type RefundResponse struct {
	RefundID string `json:"refund_id"`
	Status   string `json:"status"`
	Amount   int64  `json:"amount"`
}

// ── Path params ─────────────────────────────────────────────────────

type OrderIDPath struct {
	OrderID uuid.UUID `path:"orderId"`
}

type NoBody struct{}
