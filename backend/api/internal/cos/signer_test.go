package cos

import (
	"net/url"
	"regexp"
	"strings"
	"testing"
	"time"
)

func TestPresignPutAtIsDeterministic(t *testing.T) {
	signer := &Signer{
		SecretID:  "test-secret-id",
		SecretKey: "test-secret-key",
		Bucket:    "pawmigo-1303931411",
		Region:    "ap-chongqing",
	}
	start := time.Unix(1710000000, 0).UTC()
	ttl := 15 * time.Minute
	objectKey := "uploads/42/1710000000000000000-a1b2c3d4.jpg"

	uploadURL, fileURL := signer.presignPutAt(objectKey, start, ttl)
	uploadURLAgain, fileURLAgain := signer.presignPutAt(objectKey, start, ttl)
	if uploadURL != uploadURLAgain || fileURL != fileURLAgain {
		t.Fatalf("presignPutAt should be deterministic\nfirst=%s %s\nsecond=%s %s", uploadURL, fileURL, uploadURLAgain, fileURLAgain)
	}

	parsed, err := url.Parse(uploadURL)
	if err != nil {
		t.Fatalf("parse uploadURL: %v", err)
	}
	if parsed.Host != "pawmigo-1303931411.cos.ap-chongqing.myqcloud.com" {
		t.Fatalf("host=%q", parsed.Host)
	}
	if parsed.EscapedPath() != "/"+objectKey {
		t.Fatalf("path=%q", parsed.EscapedPath())
	}

	query := parsed.Query()
	signTime := "1710000000;1710000900"
	if query.Get("q-sign-algorithm") != "sha1" {
		t.Fatalf("q-sign-algorithm=%q", query.Get("q-sign-algorithm"))
	}
	if query.Get("q-ak") != "test-secret-id" {
		t.Fatalf("q-ak=%q", query.Get("q-ak"))
	}
	if query.Get("q-sign-time") != signTime {
		t.Fatalf("q-sign-time=%q", query.Get("q-sign-time"))
	}
	if query.Get("q-key-time") != signTime {
		t.Fatalf("q-key-time=%q", query.Get("q-key-time"))
	}
	if query.Get("q-header-list") != "" {
		t.Fatalf("q-header-list=%q", query.Get("q-header-list"))
	}
	if !strings.Contains(parsed.RawQuery, "q-header-list=") {
		t.Fatalf("q-header-list missing from raw query %q", parsed.RawQuery)
	}
	if query.Get("q-url-param-list") != "" {
		t.Fatalf("q-url-param-list=%q", query.Get("q-url-param-list"))
	}
	if !strings.Contains(parsed.RawQuery, "q-url-param-list=") {
		t.Fatalf("q-url-param-list missing from raw query %q", parsed.RawQuery)
	}
	if !regexp.MustCompile(`^[0-9a-f]{40}$`).MatchString(query.Get("q-signature")) {
		t.Fatalf("q-signature=%q", query.Get("q-signature"))
	}

	wantFileURL := "https://pawmigo-1303931411.cos.ap-chongqing.myqcloud.com/" + objectKey
	if fileURL != wantFileURL {
		t.Fatalf("fileURL=%q want %q", fileURL, wantFileURL)
	}
}

func TestPresignPutAtEscapesObjectKeyPathSegments(t *testing.T) {
	signer := &Signer{
		SecretID:  "test-secret-id",
		SecretKey: "test-secret-key",
		Bucket:    "pawmigo-1303931411",
		Region:    "ap-chongqing",
	}

	uploadURL, fileURL := signer.presignPutAt("uploads/42/a b+猫.jpg", time.Unix(1710000000, 0), 15*time.Minute)
	parsed, err := url.Parse(uploadURL)
	if err != nil {
		t.Fatalf("parse uploadURL: %v", err)
	}
	if parsed.EscapedPath() != "/uploads/42/a%20b+%E7%8C%AB.jpg" {
		t.Fatalf("escaped path=%q", parsed.EscapedPath())
	}
	if fileURL != "https://pawmigo-1303931411.cos.ap-chongqing.myqcloud.com/uploads/42/a%20b+%E7%8C%AB.jpg" {
		t.Fatalf("fileURL=%q", fileURL)
	}
}
