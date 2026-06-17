package gormstore

import (
	"os"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func Open() (*gorm.DB, error) {
	var (
		db  *gorm.DB
		err error
	)
	if dsn := os.Getenv("MYSQL_DSN"); dsn != "" {
		db, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	} else {
		path := os.Getenv("PAWMIGO_DB_PATH")
		if path == "" {
			path = "pawmigo.db"
		}
		db, err = gorm.Open(sqlite.Open(path), &gorm.Config{})
	}
	if err != nil {
		return nil, err
	}
	if err := migrate(db); err != nil {
		return nil, err
	}
	return db, nil
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
