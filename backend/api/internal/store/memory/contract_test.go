package memory_test

import (
	"testing"

	"pawmigo/backend/api/internal/store"
	"pawmigo/backend/api/internal/store/memory"
	"pawmigo/backend/api/internal/store/storetest"
)

func TestStoreContract(t *testing.T) {
	storetest.RunContract(t, func(t *testing.T) store.Store {
		t.Helper()
		return memory.NewStore()
	})
}
