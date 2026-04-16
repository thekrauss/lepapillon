package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/infras/database"
	"github.com/thekrauss/lepapillon/internal/infras/router"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	// ── Config ──────────────────────────────────────────────────────
	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "internal/core/config/config.yaml"
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// ── Database ────────────────────────────────────────────────────
	db, err := initDB(cfg)
	if err != nil {
		log.Fatalf("failed to initialize database: %v", err)
	}

	if err := database.RunMigrations(ctx, db); err != nil {
		log.Fatalf("database migrations failed: %v", err)
	}

	// ── App (DI container) ──────────────────────────────────────────
	app := router.NewApp(cfg, db)
	if err := app.Init(ctx); err != nil {
		log.Fatalf("app init failed: %v", err)
	}

	// ── Run: HTTP server + worker in a single process ──────────────
	if err := app.Run(ctx); err != nil {
		log.Fatalf("app exited with error: %v", err)
	}
}

func initDB(cfg *config.GlobalConfig) (*gorm.DB, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config is required")
	}

	dsn := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, err
	}
	sqlDB.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	if err := sqlDB.PingContext(context.Background()); err != nil {
		return nil, err
	}

	log.Printf("connected to database %s:%d/%s", cfg.Database.Host, cfg.Database.Port, cfg.Database.Name)
	return db, nil
}
