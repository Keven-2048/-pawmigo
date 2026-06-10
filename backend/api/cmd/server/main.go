package main

import (
	"log"

	pawmigohttp "pawmigo/backend/api/internal/http"
	"pawmigo/backend/api/internal/store/memory"
)

func main() {
	router := pawmigohttp.NewRouter(memory.NewStore())
	if err := router.Run(":8080"); err != nil {
		log.Fatal(err)
	}
}
