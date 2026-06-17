package config

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseDotEnv(t *testing.T) {
	input := strings.NewReader(`
# comment only
MYSQL_DSN=root:pwd@tcp(127.0.0.1:3306)/pawmigo?charset=utf8mb4&parseTime=true&loc=Local
export PAWMIGO_STORE = "gorm"
PAWMIGO_JWT_SECRET='secret=with=equals'
PAWMIGO_SEED=true
`)

	values, err := parseDotEnv(input)
	if err != nil {
		t.Fatalf("parseDotEnv() error = %v", err)
	}

	t.Run("DSNValueAllowsEquals", func(t *testing.T) {
		assertEqual(t, values["MYSQL_DSN"], "root:pwd@tcp(127.0.0.1:3306)/pawmigo?charset=utf8mb4&parseTime=true&loc=Local")
	})
	t.Run("CommentLineSkipped", func(t *testing.T) {
		if _, ok := values["# comment only"]; ok {
			t.Fatal("comment line was parsed as a value")
		}
	})
	t.Run("ExportPrefixSupported", func(t *testing.T) {
		assertEqual(t, values["PAWMIGO_STORE"], "gorm")
	})
	t.Run("QuotedValueUnwrapped", func(t *testing.T) {
		assertEqual(t, values["PAWMIGO_JWT_SECRET"], "secret=with=equals")
	})
	t.Run("PlainValueParsed", func(t *testing.T) {
		assertEqual(t, values["PAWMIGO_SEED"], "true")
	})
}

func TestParseDotEnvReturnsErrorForInvalidLine(t *testing.T) {
	_, err := parseDotEnv(strings.NewReader("MISSING_EQUALS\n"))
	if err == nil {
		t.Fatal("parseDotEnv() error = nil, want error")
	}
}

func TestLoadDotEnvDoesNotOverrideExistingEnv(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".env")
	content := strings.Join([]string{
		"PAWMIGO_EXISTING=file-value",
		"PAWMIGO_NEW=new-value",
	}, "\n")
	if err := os.WriteFile(path, []byte(content), 0o600); err != nil {
		t.Fatalf("write .env: %v", err)
	}

	t.Setenv("PAWMIGO_EXISTING", "real-env-value")
	t.Setenv("PAWMIGO_NEW", "")
	if err := os.Unsetenv("PAWMIGO_NEW"); err != nil {
		t.Fatalf("unset PAWMIGO_NEW: %v", err)
	}

	if err := LoadDotEnv(path); err != nil {
		t.Fatalf("LoadDotEnv() error = %v", err)
	}

	t.Run("ExistingEnvNotOverwritten", func(t *testing.T) {
		assertEqual(t, os.Getenv("PAWMIGO_EXISTING"), "real-env-value")
	})
	t.Run("MissingEnvLoadedFromFile", func(t *testing.T) {
		assertEqual(t, os.Getenv("PAWMIGO_NEW"), "new-value")
	})
}

func TestLoadDotEnvMissingFileIsOptional(t *testing.T) {
	path := filepath.Join(t.TempDir(), ".env")
	if err := LoadDotEnv(path); err != nil {
		t.Fatalf("LoadDotEnv() error = %v, want nil", err)
	}
}

func assertEqual(t *testing.T, got, want string) {
	t.Helper()
	if got != want {
		t.Fatalf("got %q, want %q", got, want)
	}
}
