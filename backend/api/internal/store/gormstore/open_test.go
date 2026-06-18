package gormstore

import (
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

func TestResolveConfigUsesMySQLDSN(t *testing.T) {
	cfg := resolveConfig(fakeGetenv(map[string]string{
		"MYSQL_DSN":       "user:pass@tcp(localhost:3306)/pawmigo?parseTime=true",
		"PAWMIGO_DB_PATH": "/tmp/ignored.db",
	}))

	if cfg.Driver != driverMySQL {
		t.Fatalf("Driver = %q, want %q", cfg.Driver, driverMySQL)
	}
	if cfg.DSN != "user:pass@tcp(localhost:3306)/pawmigo?parseTime=true" {
		t.Fatalf("DSN = %q", cfg.DSN)
	}
	if cfg.Path != "" {
		t.Fatalf("Path = %q, want empty", cfg.Path)
	}
}

func TestResolveConfigUsesDefaultSQLitePath(t *testing.T) {
	cfg := resolveConfig(fakeGetenv(nil))

	if cfg.Driver != driverSQLite {
		t.Fatalf("Driver = %q, want %q", cfg.Driver, driverSQLite)
	}
	if cfg.Path != defaultSQLitePath {
		t.Fatalf("Path = %q, want %q", cfg.Path, defaultSQLitePath)
	}
	if cfg.DSN != "" {
		t.Fatalf("DSN = %q, want empty", cfg.DSN)
	}
}

func TestResolveConfigUsesConfiguredSQLitePath(t *testing.T) {
	cfg := resolveConfig(fakeGetenv(map[string]string{
		"PAWMIGO_DB_PATH": "/tmp/pawmigo_test.db",
	}))

	if cfg.Driver != driverSQLite {
		t.Fatalf("Driver = %q, want %q", cfg.Driver, driverSQLite)
	}
	if cfg.Path != "/tmp/pawmigo_test.db" {
		t.Fatalf("Path = %q", cfg.Path)
	}
	if cfg.DSN != "" {
		t.Fatalf("DSN = %q, want empty", cfg.DSN)
	}
}

func TestMySQLConnectionPoolSettings(t *testing.T) {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}

	if err := configureMySQLConnectionPool(db); err != nil {
		t.Fatal(err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		t.Fatal(err)
	}
	if sqlDB.Stats().MaxOpenConnections != maxOpenConns {
		t.Fatalf("MaxOpenConnections = %d, want %d", sqlDB.Stats().MaxOpenConnections, maxOpenConns)
	}
}

func fakeGetenv(values map[string]string) func(string) string {
	return func(key string) string {
		return values[key]
	}
}
