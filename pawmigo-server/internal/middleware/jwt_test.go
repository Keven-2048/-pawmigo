package middleware

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestSignAndParse(t *testing.T) {
	m := NewJWT("secret")
	token, err := m.Sign(42)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	uid, err := m.Parse(token)
	require.NoError(t, err)
	assert.Equal(t, uint64(42), uid)
}

func TestParseRejectsBadSecret(t *testing.T) {
	token, _ := NewJWT("secret").Sign(42)
	_, err := NewJWT("other").Parse(token)
	assert.Error(t, err)
}
