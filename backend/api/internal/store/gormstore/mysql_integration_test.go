//go:build mysql_integration

package gormstore_test

import (
	"context"
	"os"
	"testing"

	"gorm.io/gorm"

	"pawmigo/backend/api/internal/store"
	"pawmigo/backend/api/internal/store/gormstore"
	"pawmigo/backend/api/internal/store/storetest"
)

func TestMySQLStoreContract(t *testing.T) {
	dsn := getenvMySQLIntegrationDSN(t)
	t.Setenv("MYSQL_DSN", dsn)

	db, err := gormstore.Open()
	if err != nil {
		t.Fatalf("Open MySQL store error: %v", err)
	}
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err != nil {
			t.Errorf("get sql DB for cleanup error: %v", err)
			return
		}
		if err := sqlDB.Close(); err != nil {
			t.Errorf("close sql DB error: %v", err)
		}
	})

	storetest.RunContract(t, func(t *testing.T) store.Store {
		t.Helper()
		resetAndSeedMySQLStore(t, db)
		return gormstore.New(db)
	})
}

func getenvMySQLIntegrationDSN(t *testing.T) string {
	t.Helper()
	dsn := os.Getenv("PAWMIGO_MYSQL_TEST_DSN")
	if dsn == "" {
		t.Skip("set PAWMIGO_MYSQL_TEST_DSN to run the MySQL integration test")
	}
	return dsn
}

func resetAndSeedMySQLStore(t *testing.T, db *gorm.DB) {
	t.Helper()
	truncateMySQLTables(t, db)
	gormstore.Seed(db)

	var userCount int64
	if err := db.Table("users").Count(&userCount).Error; err != nil {
		t.Fatalf("count seeded users error: %v", err)
	}
	if userCount == 0 {
		t.Fatal("expected seeded users after MySQL reset")
	}
}

func truncateMySQLTables(t *testing.T, db *gorm.DB) {
	t.Helper()
	sqlDB, err := db.DB()
	if err != nil {
		t.Fatalf("get sql DB error: %v", err)
	}
	conn, err := sqlDB.Conn(context.Background())
	if err != nil {
		t.Fatalf("get dedicated MySQL connection error: %v", err)
	}
	defer conn.Close()

	if _, err := conn.ExecContext(context.Background(), "SET FOREIGN_KEY_CHECKS=0"); err != nil {
		t.Fatalf("disable MySQL foreign key checks error: %v", err)
	}
	for _, table := range mysqlContractTables {
		if _, err := conn.ExecContext(context.Background(), "TRUNCATE TABLE `"+table+"`"); err != nil {
			_, _ = conn.ExecContext(context.Background(), "SET FOREIGN_KEY_CHECKS=1")
			t.Fatalf("truncate MySQL table %s error: %v", table, err)
		}
	}
	if _, err := conn.ExecContext(context.Background(), "SET FOREIGN_KEY_CHECKS=1"); err != nil {
		t.Fatalf("enable MySQL foreign key checks error: %v", err)
	}
}

var mysqlContractTables = []string{
	"users",
	"pets",
	"user_locations",
	"invites",
	"posts",
	"comments",
	"likes",
	"blocks",
	"reports",
}
