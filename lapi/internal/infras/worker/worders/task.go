package worders

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const TypeOrderStatusUpdate = "order:status_update"

type OrderStatusPayload struct {
	OrderID string `json:"order_id"`
	Status  string `json:"status"`
}

func NewOrderStatusTask(orderID, status string) (*asynq.Task, error) {
	payload, err := json.Marshal(OrderStatusPayload{
		OrderID: orderID,
		Status:  status,
	})
	if err != nil {
		return nil, fmt.Errorf("marshal order status payload: %w", err)
	}
	return asynq.NewTask(TypeOrderStatusUpdate, payload, asynq.Queue("critical")), nil
}
