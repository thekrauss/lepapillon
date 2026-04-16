package worker

import (
	"context"
	"fmt"

	"github.com/hibiken/asynq"
	"github.com/thekrauss/lepapillon/internal/infras/worker/wmail"
	"github.com/thekrauss/lepapillon/internal/infras/worker/worders"
)

type TaskDistributor interface {
	EnqueueTask(ctx context.Context, task *asynq.Task, opts ...asynq.Option) error
	DistributeMailTask(ctx context.Context, to []string, subject, template string, vars map[string]string) error
	DistributeOrderStatusTask(ctx context.Context, orderID, status string) error
	Close() error
}

type RedisTaskDistributor struct {
	client *asynq.Client
}

func NewRedisTaskDistributor(redisOpt asynq.RedisClientOpt) TaskDistributor {
	client := asynq.NewClient(redisOpt)
	return &RedisTaskDistributor{client: client}
}

func (d *RedisTaskDistributor) EnqueueTask(ctx context.Context, task *asynq.Task, opts ...asynq.Option) error {
	_, err := d.client.EnqueueContext(ctx, task, opts...)
	if err != nil {
		return fmt.Errorf("enqueue task %s: %w", task.Type(), err)
	}
	return nil
}

func (d *RedisTaskDistributor) DistributeMailTask(
	ctx context.Context,
	to []string,
	subject, template string,
	vars map[string]string,
) error {
	task, err := wmail.NewMailSendTask(to, subject, template, vars)
	if err != nil {
		return err
	}
	return d.EnqueueTask(ctx, task)
}

func (d *RedisTaskDistributor) DistributeOrderStatusTask(ctx context.Context, orderID, status string) error {
	task, err := worders.NewOrderStatusTask(orderID, status)
	if err != nil {
		return err
	}
	return d.EnqueueTask(ctx, task)
}

func (d *RedisTaskDistributor) Close() error {
	return d.client.Close()
}
