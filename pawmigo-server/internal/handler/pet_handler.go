package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/pawmigo/server/internal/middleware"
	"github.com/pawmigo/server/internal/repository"
	"github.com/pawmigo/server/internal/service"
)

type PetHandler struct {
	petSvc   *service.PetService
	userRepo *repository.UserRepo
}

func NewPetHandler(petSvc *service.PetService, ur *repository.UserRepo) *PetHandler {
	return &PetHandler{petSvc: petSvc, userRepo: ur}
}

func uid(c *gin.Context) uint64 { return c.GetUint64(middleware.CtxUserID) }

func (h *PetHandler) Me(c *gin.Context) {
	u, err := h.userRepo.FindByID(uid(c))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}
	pets, _ := h.petSvc.ListByOwner(u.ID)
	c.JSON(http.StatusOK, gin.H{"user": u, "pets": pets})
}

func (h *PetHandler) CreatePet(c *gin.Context) {
	var in service.CreatePetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pet, err := h.petSvc.Create(uid(c), in)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pet)
}

func (h *PetHandler) UpdatePet(c *gin.Context) {
	petID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad id"})
		return
	}
	var in service.CreatePetInput
	if err := c.ShouldBindJSON(&in); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	pet, err := h.petSvc.Update(uid(c), petID, in)
	if errors.Is(err, service.ErrForbidden) {
		c.JSON(http.StatusForbidden, gin.H{"error": "not your pet"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pet)
}
