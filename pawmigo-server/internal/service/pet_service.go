package service

import (
	"encoding/json"
	"errors"

	"gorm.io/datatypes"

	"github.com/pawmigo/server/internal/model"
	"github.com/pawmigo/server/internal/repository"
)

var ErrForbidden = errors.New("forbidden")

type CreatePetInput struct {
	Name        string   `json:"name" binding:"required"`
	Breed       string   `json:"breed"`
	Gender      string   `json:"gender"`
	Age         int      `json:"age"`
	Personality []string `json:"personality"`
	Bio         string   `json:"bio"`
}

type PetService struct{ repo *repository.PetRepo }

func NewPetService(repo *repository.PetRepo) *PetService { return &PetService{repo: repo} }

func toJSON(v []string) datatypes.JSON {
	if v == nil {
		v = []string{}
	}
	b, _ := json.Marshal(v)
	return datatypes.JSON(b)
}

func (s *PetService) Create(ownerID uint64, in CreatePetInput) (*model.Pet, error) {
	p := &model.Pet{
		OwnerID:     ownerID,
		Name:        in.Name,
		Breed:       in.Breed,
		Gender:      in.Gender,
		Age:         in.Age,
		Personality: toJSON(in.Personality),
		Bio:         in.Bio,
	}
	if err := s.repo.Create(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PetService) Update(ownerID, petID uint64, in CreatePetInput) (*model.Pet, error) {
	p, err := s.repo.FindByID(petID)
	if err != nil {
		return nil, err
	}
	if p.OwnerID != ownerID {
		return nil, ErrForbidden
	}
	p.Name = in.Name
	p.Breed = in.Breed
	p.Gender = in.Gender
	p.Age = in.Age
	p.Personality = toJSON(in.Personality)
	p.Bio = in.Bio
	if err := s.repo.Update(p); err != nil {
		return nil, err
	}
	return p, nil
}

func (s *PetService) ListByOwner(ownerID uint64) ([]model.Pet, error) {
	return s.repo.ListByOwner(ownerID)
}
