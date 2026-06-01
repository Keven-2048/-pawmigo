package service

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/pawmigo/server/internal/repository"
)

func TestCreatePetAndList(t *testing.T) {
	db := newDB(t)
	svc := NewPetService(repository.NewPetRepo(db))

	pet, err := svc.Create(7, CreatePetInput{
		Name:        "雪球",
		Breed:       "萨摩耶",
		Gender:      "母",
		Age:         2,
		Personality: []string{"社牛", "运动健将"},
		Bio:         "微笑天使",
	})
	require.NoError(t, err)
	assert.NotZero(t, pet.ID)
	assert.Equal(t, uint64(7), pet.OwnerID)

	list, err := svc.ListByOwner(7)
	require.NoError(t, err)
	assert.Len(t, list, 1)
	assert.Equal(t, "雪球", list[0].Name)
}

func TestUpdatePetRejectsWrongOwner(t *testing.T) {
	db := newDB(t)
	svc := NewPetService(repository.NewPetRepo(db))
	pet, _ := svc.Create(7, CreatePetInput{Name: "豆豆"})

	_, err := svc.Update(999, pet.ID, CreatePetInput{Name: "黑客"})
	assert.ErrorIs(t, err, ErrForbidden)
}
