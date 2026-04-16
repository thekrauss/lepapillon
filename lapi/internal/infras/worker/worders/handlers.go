package worders

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"

	"github.com/hibiken/asynq"
)

type OrderService interface {
	UpdateStatus(ctx context.Context, orderID, status string) error
}

type OrderWorker struct {
	orderService OrderService
}

func NewOrderWorker(orderService OrderService) *OrderWorker {
	return &OrderWorker{orderService: orderService}
}

func (w *OrderWorker) HandleOrderStatusTask(ctx context.Context, t *asynq.Task) error {
	var p OrderStatusPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("json.Unmarshal failed: %v: %w", err, asynq.SkipRetry)
	}

	if w.orderService == nil {
		slog.Warn("order service not configured, skipping", "order_id", p.OrderID)
		return nil
	}

	if err := w.orderService.UpdateStatus(ctx, p.OrderID, p.Status); err != nil {
		return fmt.Errorf("update order status: %w", err)
	}

	slog.Info("order status updated",
		"order_id", p.OrderID,
		"status", p.Status,
	)
	return nil
}
