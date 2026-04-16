package router

import (
	"context"
	"fmt"
	"time"

	"github.com/hibiken/asynq"
	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/cache"
	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/infras/idempotency"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/infras/worker"
	"github.com/thekrauss/lepapillon/internal/infras/worker/wcleanup"
	mailservice "github.com/thekrauss/lepapillon/internal/modules/mail/service"
	"gorm.io/gorm"
)

// App is the root dependency container. Every infra layer and domain service
// hangs off this struct, exactly like gophercart.
type App struct {
	Config *config.GlobalConfig
	Logger *logrus.Logger

	DB         *gorm.DB
	Cache      cache.AuthCache
	Middleware *middleware.Manager
	HTTPServer Server

	Repos       *RepositoryContainer
	Services    *ServiceContainer
	Controllers *ControllerContainer
	Distributor worker.TaskDistributor
	Idempotency idempotency.Manager
}

func NewApp(cfg *config.GlobalConfig, db *gorm.DB) *App {
	return &App{
		Config: cfg,
		Logger: logrus.New(),
		DB:     db,
	}
}

// Run starts both the HTTP server and the worker in a single process.
func (a *App) Run(ctx context.Context) error {
	// Start worker in background
	go func() {
		if err := a.RunWorker(ctx); err != nil {
			logrus.WithError(err).Error("worker stopped with error")
		}
	}()

	// Start HTTP server (blocking until ctx is cancelled)
	return a.RunServer(ctx)
}

// RunServer wires all routes and starts the Gin HTTP server.
func (a *App) RunServer(ctx context.Context) error {
	AddAllRoutes(a)

	httpSrv, err := StartHTTPServer(a.Config, a.Middleware)
	if err != nil {
		return err
	}
	a.HTTPServer = Server{HTTP: httpSrv}

	<-ctx.Done()
	return GracefulShutdown(context.Background(), a.HTTPServer.HTTP, a.Config.Server.ShutdownTimeout)
}

// RunWorker starts the asynq task processor.
func (a *App) RunWorker(ctx context.Context) error {
	redisOpt := a.redisClientOpt()

	mailer := mailservice.NewMailerService(a.Config.Mail)

	processor := worker.NewRedisTaskProcessor(
		redisOpt,
		a.Config.Worker.Concurrency,
		a.DB,
		mailer,
		a.Idempotency,
	)

	errChan := make(chan error, 1)
	go func() {
		errChan <- processor.Start()
	}()

	// Periodic cleanup job: expired refresh tokens every 30 minutes
	if a.Distributor != nil {
		go func() {
			ticker := time.NewTicker(30 * time.Minute)
			defer ticker.Stop()
			for {
				select {
				case <-ctx.Done():
					return
				case <-ticker.C:
					task, err := wcleanup.NewTokenCleanupTask(1000)
					if err != nil {
						logrus.WithError(err).Warn("failed to build cleanup task")
						continue
					}
					if err := a.Distributor.EnqueueTask(context.Background(), task); err != nil {
						logrus.WithError(err).Warn("failed to enqueue cleanup task")
					}
				}
			}
		}()
		logrus.Info("Periodic token cleanup scheduled (every 30 min)")
	}

	logrus.Info("Worker is running and listening for tasks...")

	select {
	case err := <-errChan:
		return err
	case <-ctx.Done():
		logrus.Info("Shutting down worker...")
		processor.Shutdown()
	}
	return nil
}

func (a *App) redisClientOpt() asynq.RedisClientOpt {
	return asynq.RedisClientOpt{
		Addr:     fmt.Sprintf("%s:%d", a.Config.Redis.Host, a.Config.Redis.Port),
		Password: a.Config.Redis.Password,
		DB:       a.Config.Redis.DB,
	}
}

func (a *App) redisOptions() *redis.Options {
	return &redis.Options{
		Addr:     fmt.Sprintf("%s:%d", a.Config.Redis.Host, a.Config.Redis.Port),
		Password: a.Config.Redis.Password,
		DB:       a.Config.Redis.DB,
	}
}
