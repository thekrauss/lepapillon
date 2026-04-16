package database

import (
	"fmt"
	"log/slog"

	"github.com/thekrauss/lepapillon/internal/core/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func NewGormDB(cfg config.DatabaseConfig, isDev bool) (*gorm.DB, error) {
	logLevel := logger.Silent
	if isDev {
		logLevel = logger.Info
	}

	db, err := gorm.Open(postgres.Open(cfg.DSN()), &gorm.Config{
		Logger:                 logger.Default.LogMode(logLevel),
		SkipDefaultTransaction: true,
	})
	if err != nil {
		return nil, fmt.Errorf("gorm open: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("get underlying sql.DB: %w", err)
	}
	sqlDB.SetMaxOpenConns(cfg.MaxOpenConns)
	sqlDB.SetMaxIdleConns(cfg.MaxIdleConns)

	slog.Info("connected to PostgreSQL via GORM", "host", cfg.Host, "db", cfg.Name)
	return db, nil
}

// AutoMigrateModels runs GORM AutoMigrate for all provided model structs.
func AutoMigrateModels(db *gorm.DB, models ...any) error {
	if err := db.AutoMigrate(models...); err != nil {
		return fmt.Errorf("auto migrate: %w", err)
	}
	slog.Info("GORM auto-migration completed")
	return nil
}
