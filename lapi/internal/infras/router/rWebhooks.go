package router

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	paymentrepo "github.com/thekrauss/lepapillon/internal/modules/payment/repository"
	checkoutdomain "github.com/thekrauss/lepapillon/internal/modules/checkout/domain"
)

var (
	WebhookGroup = RootGroup.NewGroup("/webhooks", "Webhooks externes")
)

func addWebhookRoutes(a *App) {
	WebhookGroup.AddRoute("/payments/stripe", http.MethodPost, "Webhook Stripe", stripeWebhookHandler(a))
}

func stripeWebhookHandler(a *App) gin.HandlerFunc {
	return func(c *gin.Context) {
		body, err := io.ReadAll(c.Request.Body)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid body"})
			return
		}

		// Verify signature + parse event
		if a.Services == nil || a.Services.Payment == nil {
			logrus.Warn("stripe webhook received but payment service not configured")
			c.JSON(http.StatusOK, gin.H{"received": true, "status": "skipped"})
			return
		}

		sigHeader := c.GetHeader("Stripe-Signature")
		event, err := a.Services.Payment.HandleWebhook(body, sigHeader)
		if err != nil {
			logrus.WithError(err).Warn("stripe webhook signature verification failed")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
			return
		}

		logrus.WithFields(logrus.Fields{
			"event_id":   event.EventID,
			"event_type": event.EventType,
			"intent_id":  event.IntentID,
			"order_id":   event.OrderID,
			"status":     event.PaymentStatus,
		}).Info("stripe webhook verified")

		// Idempotency check: skip if already processed
		if a.Repos != nil && a.Repos.PaymentEvent != nil {
			exists, _ := a.Repos.PaymentEvent.EventExists(c.Request.Context(), "stripe", event.EventID)
			if exists {
				c.JSON(http.StatusOK, gin.H{"received": true, "status": "duplicate"})
				return
			}
		}

		// Process the event
		ctx := c.Request.Context()

		// Update order status based on payment event
		if event.OrderID != "" && a.Repos != nil && a.Repos.Checkout != nil {
			orderID, parseErr := uuid.Parse(event.OrderID)
			if parseErr == nil {
				switch event.PaymentStatus {
				case "paid":
					_ = a.Repos.Checkout.UpdateOrderStatus(ctx, orderID, checkoutdomain.OrderStatusPaid)
					_ = a.Repos.Checkout.SetStripePaymentIntentID(ctx, orderID, event.IntentID)
					logrus.WithField("order_id", event.OrderID).Info("order marked as paid via webhook")
				case "failed":
					_ = a.Repos.Checkout.UpdateOrderStatus(ctx, orderID, checkoutdomain.OrderStatusCancelled)
					logrus.WithField("order_id", event.OrderID).Warn("payment failed for order")
				case "refunded":
					_ = a.Repos.Checkout.UpdateOrderStatus(ctx, orderID, "refunded")
					logrus.WithField("order_id", event.OrderID).Info("order refunded via webhook")
				}
			}
		}

		// Store payment event for audit trail
		if a.Repos != nil && a.Repos.PaymentEvent != nil {
			var oid *uuid.UUID
			if parsed, err := uuid.Parse(event.OrderID); err == nil {
				oid = &parsed
			}
			_ = a.Repos.PaymentEvent.CreateEvent(ctx, &paymentrepo.PaymentEvent{
				ID:            uuid.New(),
				Provider:      "stripe",
				EventType:     event.EventType,
				EventID:       event.EventID,
				IntentID:      event.IntentID,
				OrderID:       oid,
				PaymentStatus: event.PaymentStatus,
				Payload:       json.RawMessage(body),
			})
		}

		c.JSON(http.StatusOK, gin.H{"received": true, "status": "processed"})
	}
}
