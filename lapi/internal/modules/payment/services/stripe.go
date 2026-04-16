package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/modules/payment/types"
)

var (
	ErrPaymentNotConfigured = errors.New("payment provider not configured")
	ErrInvalidSignature     = errors.New("invalid webhook signature")
	ErrSignatureExpired     = errors.New("webhook signature expired")
)

const (
	stripeAPIBase     = "https://api.stripe.com/v1"
	webhookTolerance  = 5 * time.Minute
)

// Service defines the payment provider contract.
type Service interface {
	CreateIntent(amount int64, currency string, metadata map[string]string, idempotencyKey string) (*types.IntentResponse, error)
	GetIntent(intentID string) (*types.IntentStatusResponse, error)
	RefundIntent(intentID string, amount *int64, metadata map[string]string) (*types.RefundResponse, error)
	HandleWebhook(payload []byte, signature string) (*types.WebhookEvent, error)
}

type stripeService struct {
	secretKey      string
	publishableKey string
	webhookSecret  string
	currency       string
	httpClient     *http.Client
}

func NewStripeService(cfg config.PaymentConfig) (Service, error) {
	if strings.TrimSpace(cfg.StripeSecretKey) == "" {
		return nil, ErrPaymentNotConfigured
	}
	timeout := cfg.HTTPTimeout
	if timeout <= 0 {
		timeout = 10 * time.Second
	}
	currency := strings.ToLower(strings.TrimSpace(cfg.Currency))
	if currency == "" {
		currency = "eur"
	}
	return &stripeService{
		secretKey:      strings.TrimSpace(cfg.StripeSecretKey),
		publishableKey: strings.TrimSpace(cfg.StripePublishableKey),
		webhookSecret:  strings.TrimSpace(cfg.StripeWebhookSecret),
		currency:       currency,
		httpClient:     &http.Client{Timeout: timeout},
	}, nil
}

// ── CreateIntent ────────────────────────────────────────────────────

func (s *stripeService) CreateIntent(amount int64, currency string, metadata map[string]string, idempotencyKey string) (*types.IntentResponse, error) {
	if currency == "" {
		currency = s.currency
	}
	form := url.Values{}
	form.Set("amount", strconv.FormatInt(amount, 10))
	form.Set("currency", currency)
	form.Set("automatic_payment_methods[enabled]", "true")
	for k, v := range metadata {
		form.Set(fmt.Sprintf("metadata[%s]", k), v)
	}

	req, err := http.NewRequest(http.MethodPost, stripeAPIBase+"/payment_intents", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if idempotencyKey != "" {
		req.Header.Set("Idempotency-Key", idempotencyKey)
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("stripe create intent: connection error")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("stripe create intent failed (status %d)", resp.StatusCode)
	}

	var result struct {
		ID           string `json:"id"`
		ClientSecret string `json:"client_secret"`
		Status       string `json:"status"`
		Amount       int64  `json:"amount"`
		Currency     string `json:"currency"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("stripe create intent: invalid response")
	}

	return &types.IntentResponse{
		IntentID:       result.ID,
		ClientSecret:   result.ClientSecret,
		PublishableKey: s.publishableKey,
		Status:         normalizeStatus(result.Status),
		Amount:         result.Amount,
		Currency:       result.Currency,
	}, nil
}

// ── GetIntent ───────────────────────────────────────────────────────

func (s *stripeService) GetIntent(intentID string) (*types.IntentStatusResponse, error) {
	req, err := http.NewRequest(http.MethodGet, stripeAPIBase+"/payment_intents/"+url.PathEscape(intentID), nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.secretKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("stripe get intent: connection error")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("stripe get intent failed (status %d)", resp.StatusCode)
	}

	var result struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Amount int64  `json:"amount"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("stripe get intent: invalid response")
	}

	return &types.IntentStatusResponse{
		IntentID: result.ID,
		Status:   normalizeStatus(result.Status),
		Amount:   result.Amount,
	}, nil
}

// ── RefundIntent ────────────────────────────────────────────────────

func (s *stripeService) RefundIntent(intentID string, amount *int64, metadata map[string]string) (*types.RefundResponse, error) {
	form := url.Values{}
	form.Set("payment_intent", intentID)
	if amount != nil {
		form.Set("amount", strconv.FormatInt(*amount, 10))
	}
	for k, v := range metadata {
		form.Set(fmt.Sprintf("metadata[%s]", k), v)
	}

	idempotencyKey := fmt.Sprintf("refund:%s", intentID)
	if amount != nil {
		idempotencyKey += fmt.Sprintf(":%d", *amount)
	}

	req, err := http.NewRequest(http.MethodPost, stripeAPIBase+"/refunds", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.secretKey)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Idempotency-Key", idempotencyKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("stripe refund: connection error")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("stripe refund failed (status %d)", resp.StatusCode)
	}

	var result struct {
		ID     string `json:"id"`
		Status string `json:"status"`
		Amount int64  `json:"amount"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("stripe refund: invalid response")
	}

	return &types.RefundResponse{
		RefundID: result.ID,
		Status:   result.Status,
		Amount:   result.Amount,
	}, nil
}

// ── HandleWebhook ───────────────────────────────────────────────────

func (s *stripeService) HandleWebhook(payload []byte, signature string) (*types.WebhookEvent, error) {
	if err := s.verifySignature(payload, signature); err != nil {
		return nil, err
	}

	var event struct {
		ID   string `json:"id"`
		Type string `json:"type"`
		Data struct {
			Object struct {
				ID       string            `json:"id"`
				Status   string            `json:"status"`
				Metadata map[string]string `json:"metadata"`
			} `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(payload, &event); err != nil {
		return nil, fmt.Errorf("invalid webhook payload")
	}

	return &types.WebhookEvent{
		EventID:       event.ID,
		EventType:     event.Type,
		IntentID:      event.Data.Object.ID,
		OrderID:       event.Data.Object.Metadata["order_id"],
		PaymentStatus: webhookEventToStatus(event.Type, event.Data.Object.Status),
	}, nil
}

// ── Signature verification (HMAC-SHA256) ────────────────────────────

func (s *stripeService) verifySignature(payload []byte, header string) error {
	if s.webhookSecret == "" {
		return ErrPaymentNotConfigured
	}

	parts := strings.Split(header, ",")
	var timestamp string
	var signatures []string
	for _, p := range parts {
		kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
		if len(kv) != 2 {
			continue
		}
		switch kv[0] {
		case "t":
			timestamp = kv[1]
		case "v1":
			signatures = append(signatures, kv[1])
		}
	}

	if timestamp == "" || len(signatures) == 0 {
		return ErrInvalidSignature
	}

	// Check timestamp tolerance
	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return ErrInvalidSignature
	}
	if math.Abs(float64(time.Now().Unix()-ts)) > webhookTolerance.Seconds() {
		return ErrSignatureExpired
	}

	// Compute expected signature
	signed := fmt.Sprintf("%s.%s", timestamp, string(payload))
	mac := hmac.New(sha256.New, []byte(s.webhookSecret))
	mac.Write([]byte(signed))
	expected := hex.EncodeToString(mac.Sum(nil))

	for _, sig := range signatures {
		if hmac.Equal([]byte(sig), []byte(expected)) {
			return nil
		}
	}
	return ErrInvalidSignature
}

// ── Status mapping ──────────────────────────────────────────────────

func normalizeStatus(stripeStatus string) string {
	switch stripeStatus {
	case "succeeded":
		return "paid"
	case "requires_capture", "processing":
		return "pending"
	case "requires_payment_method", "canceled":
		return "failed"
	default:
		return "pending"
	}
}

func webhookEventToStatus(eventType, objectStatus string) string {
	switch eventType {
	case "payment_intent.succeeded":
		return "paid"
	case "payment_intent.payment_failed":
		return "failed"
	case "payment_intent.canceled":
		return "failed"
	case "charge.refunded":
		return "refunded"
	default:
		return normalizeStatus(objectStatus)
	}
}
