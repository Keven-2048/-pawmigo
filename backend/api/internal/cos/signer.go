package cos

import (
	"crypto/hmac"
	"crypto/sha1"
	"encoding/hex"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

type Signer struct {
	SecretID  string
	SecretKey string
	Bucket    string
	Region    string
}

func NewFromEnv() (*Signer, bool) {
	signer := &Signer{
		SecretID:  strings.TrimSpace(os.Getenv("COS_SECRET_ID")),
		SecretKey: strings.TrimSpace(os.Getenv("COS_SECRET_KEY")),
		Bucket:    strings.TrimSpace(os.Getenv("COS_BUCKET")),
		Region:    strings.TrimSpace(os.Getenv("COS_REGION")),
	}
	if signer.SecretID == "" || signer.SecretKey == "" || signer.Bucket == "" || signer.Region == "" {
		return nil, false
	}
	return signer, true
}

func (s *Signer) PresignPut(objectKey string, ttl time.Duration) (uploadURL string, fileURL string) {
	return s.presignPutAt(objectKey, time.Now(), ttl)
}

func (s *Signer) presignPutAt(objectKey string, start time.Time, ttl time.Duration) (uploadURL string, fileURL string) {
	escapedPath := "/" + escapeObjectKey(objectKey)
	host := s.Bucket + ".cos." + s.Region + ".myqcloud.com"
	fileURL = "https://" + host + escapedPath

	startTs := start.Unix()
	endTs := start.Add(ttl).Unix()
	signTime := formatSignTime(startTs, endTs)
	keyTime := signTime

	httpString := "put\n" + escapedPath + "\n\n\n"
	httpStringHash := sha1Hex([]byte(httpString))
	stringToSign := "sha1\n" + signTime + "\n" + httpStringHash + "\n"

	signKey := hmacSHA1Hex([]byte(s.SecretKey), []byte(keyTime))
	signature := hmacSHA1Hex([]byte(signKey), []byte(stringToSign))

	query := url.Values{}
	query.Set("q-sign-algorithm", "sha1")
	query.Set("q-ak", s.SecretID)
	query.Set("q-sign-time", signTime)
	query.Set("q-key-time", keyTime)
	query.Set("q-header-list", "")
	query.Set("q-url-param-list", "")
	query.Set("q-signature", signature)

	uploadURL = fileURL + "?" + query.Encode()
	return uploadURL, fileURL
}

func formatSignTime(startTs int64, endTs int64) string {
	return strconv.FormatInt(startTs, 10) + ";" + strconv.FormatInt(endTs, 10)
}

func escapeObjectKey(objectKey string) string {
	parts := strings.Split(objectKey, "/")
	for i, part := range parts {
		parts[i] = url.PathEscape(part)
	}
	return strings.Join(parts, "/")
}

func sha1Hex(data []byte) string {
	sum := sha1.Sum(data)
	return hex.EncodeToString(sum[:])
}

func hmacSHA1Hex(key []byte, data []byte) string {
	mac := hmac.New(sha1.New, key)
	_, _ = mac.Write(data)
	return hex.EncodeToString(mac.Sum(nil))
}
