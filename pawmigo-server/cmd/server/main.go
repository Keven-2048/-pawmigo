package main

import (
	"log"

	"github.com/pawmigo/server/internal/config"
	"github.com/pawmigo/server/internal/handler"
	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/service"
	"github.com/pawmigo/server/internal/wxauth"
)

func main() {
	cfg := config.Load()

	db, err := repository.OpenMySQL(cfg.MySQLDSN)
	if err != nil {
		log.Fatalf("mysql: %v", err)
	}
	_ = repository.OpenRedis(cfg.RedisAddr) // Plan 2 起使用

	jwt := middleware.NewJWT(cfg.JWTSecret)
	userRepo := repository.NewUserRepo(db)
	petSvc := service.NewPetService(repository.NewPetRepo(db))
	authSvc := service.NewAuthService(
		wxauth.NewHTTPClient(cfg.WXAppID, cfg.WXSecret), userRepo, jwt,
	)

	r := handler.NewRouter(
		handler.NewAuthHandler(authSvc),
		handler.NewPetHandler(petSvc, userRepo),
		jwt,
	)
	log.Printf("listening on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatal(err)
	}
}
