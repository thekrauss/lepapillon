package database

import (
	"context"
	"embed"
	"fmt"
	"sort"
	"strings"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// RunMigrations executes all pending .up.sql files inside the embedded
// migrations/ directory. Tracks applied files in a schema_migrations table.
func RunMigrations(_ context.Context, db *gorm.DB) error {
	if err := createMigrationsTable(db); err != nil {
		return err
	}

	entries, err := migrationsFS.ReadDir("migrations")
	if err != nil {
		return fmt.Errorf("read migrations dir: %w", err)
	}

	var upFiles []string
	for _, e := range entries {
		if strings.HasSuffix(e.Name(), ".up.sql") {
			upFiles = append(upFiles, e.Name())
		}
	}
	sort.Strings(upFiles)

	for _, name := range upFiles {
		applied, err := isMigrationApplied(db, name)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		content, err := migrationsFS.ReadFile("migrations/" + name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}

		err = db.Transaction(func(tx *gorm.DB) error {
			if err := tx.Exec(string(content)).Error; err != nil {
				return fmt.Errorf("exec migration %s: %w", name, err)
			}
			if err := tx.Exec("INSERT INTO schema_migrations (name) VALUES (?)", name).Error; err != nil {
				return fmt.Errorf("record migration %s: %w", name, err)
			}
			return nil
		})
		if err != nil {
			return err
		}

		logrus.Infof("applied migration: %s", name)
	}

	return nil
}

func createMigrationsTable(db *gorm.DB) error {
	return db.Exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			name VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMPTZ DEFAULT NOW()
		)
	`).Error
}

func isMigrationApplied(db *gorm.DB, name string) (bool, error) {
	var count int64
	err := db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE name = ?", name).Scan(&count).Error
	return count > 0, err
}
