package wcleanup

import (
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
)

const TypeTokenCleanup = "cleanup:expired_tokens"

type TokenCleanupPayload struct {
	BatchSize int `json:"batch_size"`
}

func NewTokenCleanupTask(batchSize int) (*asynq.Task, error) {
	if batchSize <= 0 {
		batchSize = 1000
	}
	payload, err := json.Marshal(TokenCleanupPayload{BatchSize: batchSize})
	if err != nil {
		return nil, fmt.Errorf("marshal cleanup payload: %w", err)
	}
	return asynq.NewTask(TypeTokenCleanup, payload, asynq.Queue("low")), nil
}
