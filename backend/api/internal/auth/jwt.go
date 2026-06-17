package auth

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	secretEnvName        = "PAWMIGO_JWT_SECRET"
	developmentJWTSecret = "pawmigo-development-jwt-secret"
	tokenTTL             = 7 * 24 * time.Hour
)

var (
	ErrInvalidToken     = errors.New("invalid token")
	ErrInvalidSignature = errors.New("invalid token signature")
	ErrExpiredToken     = errors.New("token expired")
)

type jwtHeader struct {
	Algorithm string `json:"alg"`
	Type      string `json:"typ"`
}

type claims struct {
	Subject  string `json:"sub"`
	IssuedAt int64  `json:"iat"`
	Expires  int64  `json:"exp"`
}

// Issue signs a minimal HS256 JWT. Production deployments must set
// PAWMIGO_JWT_SECRET because the fallback secret is for local development only.
func Issue(userID int64) (string, error) {
	now := time.Now()
	return issueWithTimes(userID, now, now.Add(tokenTTL))
}

func issueWithTimes(userID int64, issuedAt time.Time, expiresAt time.Time) (string, error) {
	header := jwtHeader{Algorithm: "HS256", Type: "JWT"}
	payload := claims{
		Subject:  strconv.FormatInt(userID, 10),
		IssuedAt: issuedAt.Unix(),
		Expires:  expiresAt.Unix(),
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", err
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	unsigned := encodeSegment(headerJSON) + "." + encodeSegment(payloadJSON)
	signature := sign(unsigned)
	return unsigned + "." + encodeSegment(signature), nil
}

func Parse(token string) (int64, error) {
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		return 0, ErrInvalidToken
	}

	headerJSON, err := decodeSegment(parts[0])
	if err != nil {
		return 0, ErrInvalidToken
	}
	var header jwtHeader
	if err := json.Unmarshal(headerJSON, &header); err != nil {
		return 0, ErrInvalidToken
	}
	if header.Algorithm != "HS256" {
		return 0, ErrInvalidToken
	}

	expectedSignature := sign(parts[0] + "." + parts[1])
	actualSignature, err := decodeSegment(parts[2])
	if err != nil {
		return 0, ErrInvalidToken
	}
	if !hmac.Equal(actualSignature, expectedSignature) {
		return 0, ErrInvalidSignature
	}

	payloadJSON, err := decodeSegment(parts[1])
	if err != nil {
		return 0, ErrInvalidToken
	}
	var payload claims
	if err := json.Unmarshal(payloadJSON, &payload); err != nil {
		return 0, ErrInvalidToken
	}
	if payload.Expires <= time.Now().Unix() {
		return 0, ErrExpiredToken
	}

	userID, err := strconv.ParseInt(payload.Subject, 10, 64)
	if err != nil || userID <= 0 {
		return 0, ErrInvalidToken
	}
	return userID, nil
}

func encodeSegment(value []byte) string {
	return base64.RawURLEncoding.EncodeToString(value)
}

func decodeSegment(value string) ([]byte, error) {
	decoded, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrInvalidToken, err)
	}
	return decoded, nil
}

func sign(unsigned string) []byte {
	mac := hmac.New(sha256.New, []byte(jwtSecret()))
	mac.Write([]byte(unsigned))
	return mac.Sum(nil)
}

func jwtSecret() string {
	secret := os.Getenv(secretEnvName)
	if secret == "" {
		return developmentJWTSecret
	}
	return secret
}
