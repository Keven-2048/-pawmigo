package main

import (
	"log"
	"os"
	"strings"

	pawmigohttp "pawmigo/backend/api/internal/http"
	storepkg "pawmigo/backend/api/internal/store"
	"pawmigo/backend/api/internal/store/gormstore"
	"pawmigo/backend/api/internal/store/memory"
)

func main() {
	mode := os.Getenv("PAWMIGO_STORE")
	if mode != "gorm" {
		mode = "memory"
	}

	var store storepkg.Store
	switch mode {
	case "gorm":
		db, err := gormstore.Open()
		if err != nil {
			log.Fatal(err)
		}
		if os.Getenv("MYSQL_DSN") == "" || seedEnabled(os.Getenv("PAWMIGO_SEED")) {
			gormstore.SeedIfEmpty(db)
		}
		store = gormstore.New(db)
	default:
		store = memory.NewStore()
	}

	log.Printf("store mode: %s", mode)

	router := pawmigohttp.NewRouter(store)
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}

func seedEnabled(value string) bool {
	return value == "1" || strings.EqualFold(value, "true")
}
