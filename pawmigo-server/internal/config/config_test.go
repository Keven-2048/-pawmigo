package config

import (
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestLoadFromEnv(t *testing.T) {
	os.Setenv("MYSQL_DSN", "user:pass@tcp(localhost:3306)/pawmigo")
	os.Setenv("REDIS_ADDR", "localhost:6379")
	os.Setenv("JWT_SECRET", "s3cret")
	os.Setenv("WX_APPID", "wxapp")
	os.Setenv("WX_SECRET", "wxsecret")
	defer os.Clearenv()

	cfg := Load()

	assert.Equal(t, "user:pass@tcp(localhost:3306)/pawmigo", cfg.MySQLDSN)
	assert.Equal(t, "localhost:6379", cfg.RedisAddr)
	assert.Equal(t, "s3cret", cfg.JWTSecret)
	assert.Equal(t, "wxapp", cfg.WXAppID)
	assert.Equal(t, "wxsecret", cfg.WXSecret)
	assert.Equal(t, "8080", cfg.Port) // 默认值
}
