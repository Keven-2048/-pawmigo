package gormstore

import (
	"os"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

const (
	driverMySQL  = "mysql"
	driverSQLite = "sqlite"

	defaultSQLitePath = "pawmigo.db"

	// Keep the production pool conservative until traffic patterns are measured.
	maxOpenConns    = 20
	maxIdleConns    = 10
	connMaxLifetime = time.Hour
)

type dbConfig struct {
	Driver string
	DSN    string
	Path   string
}

func resolveConfig(getenv func(string) string) dbConfig {
	if dsn := getenv("MYSQL_DSN"); dsn != "" {
		return dbConfig{Driver: driverMySQL, DSN: dsn}
	}

	path := getenv("PAWMIGO_DB_PATH")
	if path == "" {
		path = defaultSQLitePath
	}
	return dbConfig{Driver: driverSQLite, Path: path}
}

func Open() (*gorm.DB, error) {
	var (
		db  *gorm.DB
		err error
	)
	cfg := resolveConfig(os.Getenv)
	if cfg.Driver == driverMySQL {
		db, err = gorm.Open(mysql.Open(cfg.DSN), &gorm.Config{})
		if err == nil {
			err = configureMySQLConnectionPool(db)
		}
	} else {
		db, err = gorm.Open(sqlite.Open(cfg.Path), &gorm.Config{})
	}
	if err != nil {
		return nil, err
	}
	if err := migrate(db); err != nil {
		return nil, err
	}
	return db, nil
}

func configureMySQLConnectionPool(db *gorm.DB) error {
	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	sqlDB.SetMaxOpenConns(maxOpenConns)
	sqlDB.SetMaxIdleConns(maxIdleConns)
	sqlDB.SetConnMaxLifetime(connMaxLifetime)
	return nil
}

func OpenForTest() *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	sqlDB, err := db.DB()
	if err != nil {
		panic(err)
	}
	sqlDB.SetMaxOpenConns(1)
	if err := migrate(db); err != nil {
		panic(err)
	}
	return db
}

func migrate(db *gorm.DB) error {
	return db.AutoMigrate(
		&User{},
		&Pet{},
		&UserLocation{},
		&Invite{},
		&Post{},
		&Comment{},
		&Like{},
		&Block{},
		&Report{},
	)
}
