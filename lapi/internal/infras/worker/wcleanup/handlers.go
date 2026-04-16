package wcleanup

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/hibiken/asynq"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CleanupWorker struct {
	db *gorm.DB
}

func NewCleanupWorker(db *gorm.DB) *CleanupWorker {
	return &CleanupWorker{db: db}
}

func (w *CleanupWorker) HandleTokenCleanup(ctx context.Context, t *asynq.Task) error {
	var p TokenCleanupPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("unmarshal cleanup payload: %v: %w", err, asynq.SkipRetry)
	}

	if p.BatchSize <= 0 {
		p.BatchSize = 1000
	}

	result := w.db.WithContext(ctx).Exec(
		"DELETE FROM refresh_tokens WHERE expires_at < NOW() LIMIT ?", p.BatchSize,
	)
	if result.Error != nil {
		// PostgreSQL doesn't support LIMIT in DELETE — use subquery
		result = w.db.WithContext(ctx).Exec(`
			DELETE FROM refresh_tokens WHERE id IN (
				SELECT id FROM refresh_tokens WHERE expires_at < NOW() LIMIT ?
			)
		`, p.BatchSize)
	}

	if result.Error != nil {
		return fmt.Errorf("cleanup expired tokens: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		logrus.WithField("deleted", result.RowsAffected).Info("cleaned up expired refresh tokens")
	}
	return nil
}
