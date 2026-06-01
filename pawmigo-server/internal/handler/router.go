package handler

import (
	"github.com/gin-gonic/gin"

	"github.com/pawmigo/server/internal/middleware"
)

func NewRouter(auth *AuthHandler, pet *PetHandler, jwt *middleware.JWT) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())

	v1 := r.Group("/api/v1")
	v1.POST("/auth/wx-login", auth.WXLogin)

	authed := v1.Group("")
	authed.Use(jwt.Middleware())
	authed.GET("/me", pet.Me)
	authed.POST("/pets", pet.CreatePet)
	authed.PUT("/pets/:id", pet.UpdatePet)

	return r
}
