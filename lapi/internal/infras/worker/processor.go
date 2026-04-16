package worker

import (
	"context"

	"github.com/hibiken/asynq"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/infras/idempotency"
	"github.com/thekrauss/lepapillon/internal/infras/worker/wcleanup"
	"github.com/thekrauss/lepapillon/internal/infras/worker/wmail"
	"github.com/thekrauss/lepapillon/internal/infras/worker/worders"
	"gorm.io/gorm"
)

type TaskProcessor struct {
	server        *asynq.Server
	mailWorker    *wmail.MailWorker
	orderWorker   *worders.OrderWorker
	cleanupWorker *wcleanup.CleanupWorker
}

// NewRedisTaskProcessor builds the asynq processor with all task handlers.
func NewRedisTaskProcessor(
	redisOpt asynq.RedisClientOpt,
	concurrency int,
	db *gorm.DB,
	mailer wmail.Sender,
	idempotencyMgr idempotency.Manager,
) *TaskProcessor {
	if concurrency <= 0 {
		concurrency = 10
	}

	server := asynq.NewServer(redisOpt, asynq.Config{
		Concurrency: concurrency,
		Queues: map[string]int{
			"critical": 6,
			"default":  3,
			"low":      1,
		},
		ErrorHandler: asynq.ErrorHandlerFunc(func(ctx context.Context, task *asynq.Task, err error) {
			logrus.WithError(err).WithField("type", task.Type()).Error("worker task failed")
		}),
	})

	return &TaskProcessor{
		server:        server,
		mailWorker:    wmail.NewMailWorker(mailer),
		orderWorker:   worders.NewOrderWorker(nil),
		cleanupWorker: wcleanup.NewCleanupWorker(db),
	}
}

func (p *TaskProcessor) Start() error {
	mux := asynq.NewServeMux()

	mux.HandleFunc(wmail.TypeMailSend, p.mailWorker.HandleMailSendTask)
	mux.HandleFunc(worders.TypeOrderStatusUpdate, p.orderWorker.HandleOrderStatusTask)
	mux.HandleFunc(wcleanup.TypeTokenCleanup, p.cleanupWorker.HandleTokenCleanup)

	logrus.Info("starting worker processor")
	return p.server.Start(mux)
}

func (p *TaskProcessor) Shutdown() {
	p.server.Shutdown()
	logrus.Info("worker processor stopped")
}
