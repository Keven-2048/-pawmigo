package repository

import (
	"gorm.io/gorm"

	"github.com/pawmigo/server/internal/model"
)

type PetRepo struct{ db *gorm.DB }

func NewPetRepo(db *gorm.DB) *PetRepo { return &PetRepo{db: db} }

func (r *PetRepo) Create(p *model.Pet) error { return r.db.Create(p).Error }

func (r *PetRepo) Update(p *model.Pet) error { return r.db.Save(p).Error }

func (r *PetRepo) FindByID(id uint64) (*model.Pet, error) {
	var p model.Pet
	if err := r.db.First(&p, id).Error; err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PetRepo) ListByOwner(ownerID uint64) ([]model.Pet, error) {
	var pets []model.Pet
	if err := r.db.Where("owner_id = ?", ownerID).Find(&pets).Error; err != nil {
		return nil, err
	}
	return pets, nil
}
