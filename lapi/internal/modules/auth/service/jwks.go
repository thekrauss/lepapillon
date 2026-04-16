package service

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

type jwksDocument struct {
	Keys []jwkKey `json:"keys"`
}

type jwkKey struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	Use string `json:"use"`
	Alg string `json:"alg"`
	N   string `json:"n"`
	E   string `json:"e"`
}

type cachedJWK struct {
	publicKey *rsa.PublicKey
	expiresAt time.Time
}

type jwksCache struct {
	mu           sync.RWMutex
	byKid        map[string]cachedJWK
	ttl          time.Duration
	httpClient   *http.Client
	refreshGroup singleflight.Group // M6 FIX: prevents thundering herd on JWKS refresh
}

func newJWKSCache(ttl time.Duration, httpClient *http.Client) *jwksCache {
	if ttl <= 0 {
		ttl = 10 * time.Minute
	}
	if httpClient == nil {
		httpClient = &http.Client{Timeout: 5 * time.Second}
	}
	return &jwksCache{
		byKid:      make(map[string]cachedJWK),
		ttl:        ttl,
		httpClient: httpClient,
	}
}

func (c *jwksCache) GetPublicKey(ctx context.Context, jwksURL string, kid string) (*rsa.PublicKey, error) {
	if strings.TrimSpace(kid) == "" {
		return nil, errors.New("jwt kid is required")
	}
	now := time.Now().UTC()

	c.mu.RLock()
	entry, ok := c.byKid[kid]
	c.mu.RUnlock()
	if ok && now.Before(entry.expiresAt) && entry.publicKey != nil {
		return entry.publicKey, nil
	}

	// M6 FIX: singleflight — only one goroutine fetches JWKS, all others wait.
	_, err, _ := c.refreshGroup.Do("jwks_refresh", func() (interface{}, error) {
		return nil, c.refresh(ctx, jwksURL)
	})
	if err != nil {
		return nil, err
	}

	c.mu.RLock()
	entry, ok = c.byKid[kid]
	c.mu.RUnlock()
	if !ok || entry.publicKey == nil || now.After(entry.expiresAt) {
		return nil, fmt.Errorf("jwks key not found for kid: %s", kid)
	}
	return entry.publicKey, nil
}

func (c *jwksCache) refresh(ctx context.Context, jwksURL string) error {
	if strings.TrimSpace(jwksURL) == "" {
		return errors.New("jwks url is required")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, jwksURL, nil)
	if err != nil {
		return err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("jwks endpoint returned status %d", resp.StatusCode)
	}

	var doc jwksDocument
	if err := json.NewDecoder(resp.Body).Decode(&doc); err != nil {
		return err
	}

	now := time.Now().UTC()
	next := make(map[string]cachedJWK, len(doc.Keys))
	for _, key := range doc.Keys {
		if strings.TrimSpace(key.Kid) == "" || strings.ToUpper(strings.TrimSpace(key.Kty)) != "RSA" {
			continue
		}
		publicKey, err := rsaPublicKeyFromJWK(key)
		if err != nil {
			continue
		}
		next[key.Kid] = cachedJWK{publicKey: publicKey, expiresAt: now.Add(c.ttl)}
	}
	if len(next) == 0 {
		return errors.New("jwks refresh returned no usable rsa keys")
	}

	c.mu.Lock()
	c.byKid = next
	c.mu.Unlock()
	return nil
}

func rsaPublicKeyFromJWK(key jwkKey) (*rsa.PublicKey, error) {
	nb, err := base64.RawURLEncoding.DecodeString(key.N)
	if err != nil {
		return nil, fmt.Errorf("decode jwk modulus: %w", err)
	}
	eb, err := base64.RawURLEncoding.DecodeString(key.E)
	if err != nil {
		return nil, fmt.Errorf("decode jwk exponent: %w", err)
	}
	n := new(big.Int).SetBytes(nb)
	e := new(big.Int).SetBytes(eb)
	if !e.IsInt64() || e.Int64() <= 0 {
		return nil, errors.New("invalid jwk exponent")
	}
	return &rsa.PublicKey{N: n, E: int(e.Int64())}, nil
}
