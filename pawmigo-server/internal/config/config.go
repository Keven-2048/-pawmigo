package config

import "os"

type Config struct {
	Port      string
	MySQLDSN  string
	RedisAddr string
	JWTSecret string
	WXAppID   string
	WXSecret  string
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		MySQLDSN:  getEnv("MYSQL_DSN", ""),
		RedisAddr: getEnv("REDIS_ADDR", ""),
		JWTSecret: getEnv("JWT_SECRET", ""),
		WXAppID:   getEnv("WX_APPID", ""),
		WXSecret:  getEnv("WX_SECRET", ""),
	}
}
