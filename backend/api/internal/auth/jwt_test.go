package auth

import (
	"errors"
	"strings"
	"testing"
	"time"
)

func TestIssueParseRoundTrip(t *testing.T) {
	token, err := Issue(42)
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}

	userID, err := Parse(token)
	if err != nil {
		t.Fatalf("Parse() error = %v", err)
	}
	if userID != 42 {
		t.Fatalf("Parse() userID = %d, want 42", userID)
	}
}

func TestParseRejectsTamperedSignature(t *testing.T) {
	token, err := Issue(42)
	if err != nil {
		t.Fatalf("Issue() error = %v", err)
	}
	parts := strings.Split(token, ".")
	parts[2] = "tampered"

	if _, err := Parse(strings.Join(parts, ".")); !errors.Is(err, ErrInvalidSignature) {
		t.Fatalf("Parse() error = %v, want ErrInvalidSignature", err)
	}
}

func TestParseRejectsMalformedToken(t *testing.T) {
	if _, err := Parse("not-a-jwt"); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("Parse() error = %v, want ErrInvalidToken", err)
	}
}

func TestParseRejectsExpiredToken(t *testing.T) {
	now := time.Now()
	token, err := issueWithTimes(42, now.Add(-2*time.Hour), now.Add(-time.Hour))
	if err != nil {
		t.Fatalf("issueWithTimes() error = %v", err)
	}

	if _, err := Parse(token); !errors.Is(err, ErrExpiredToken) {
		t.Fatalf("Parse() error = %v, want ErrExpiredToken", err)
	}
}
