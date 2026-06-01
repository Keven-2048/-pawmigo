package repository

import (
	"github.com/redis/go-redis/v9"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

func OpenMySQL(dsn string) (*gorm.DB, error) {
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}
	if err := db.AutoMigrate(&model.User{}, &model.Pet{}); err != nil {
		return nil, err
	}
	return db, nil
}

func OpenRedis(addr string) *redis.Client {
	return redis.NewClient(&redis.Options{Addr: addr})
}
