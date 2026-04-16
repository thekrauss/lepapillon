package cache

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/dgraph-io/ristretto"
)

// ErrCacheMiss is returned by Get when the key does not exist in the cache.
// Callers should check errors.Is(err, ErrCacheMiss) to distinguish a true
// miss from an operational error (network, decode, etc.).
var ErrCacheMiss = fmt.Errorf("cache: miss")

type AccessTokenClaims struct {
	UserID    string
	Email     string
	TenantID  string
	Roles     []string
	Scopes    []string
	ExpiresAt int64
	JTI       string
}

type APIKeyValidation struct {
	UserID   string
	TenantID string
	Kind     string
	Scopes   []string
}

type AuthCache interface {
	SetAccessTokenClaims(ctx context.Context, token string, claims AccessTokenClaims, ttl time.Duration) error
	GetAccessTokenClaims(ctx context.Context, token string) (AccessTokenClaims, bool, error)
	BlacklistAccessTokenJTI(ctx context.Context, jti string, ttl time.Duration) error
	IsAccessTokenJTIBlacklisted(ctx context.Context, jti string) (bool, error)

	SetAPIKeyValidation(ctx context.Context, rawKey string, validation APIKeyValidation, ttl time.Duration) error
	GetAPIKeyValidation(ctx context.Context, rawKey string) (APIKeyValidation, bool, error)
	RevokeAPIKeyPrefix(ctx context.Context, prefix string, ttl time.Duration) error
	IsAPIKeyPrefixRevoked(ctx context.Context, prefix string) (bool, error)

	Get(ctx context.Context, key string) (string, error)
	Set(ctx context.Context, key string, value string, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
}

type RistrettoAuthCache struct {
	cache *ristretto.Cache
}

func NewRistrettoAuthCache() (*RistrettoAuthCache, error) {
	cache, err := ristretto.NewCache(&ristretto.Config{
		NumCounters: 1e7,
		MaxCost:     1 << 30,
		BufferItems: 64,
	})
	if err != nil {
		return nil, err
	}
	return &RistrettoAuthCache{cache: cache}, nil
}

func (c *RistrettoAuthCache) SetAccessTokenClaims(ctx context.Context, token string, claims AccessTokenClaims, ttl time.Duration) error {
	key := "claims:" + secureKey(token)
	c.cache.SetWithTTL(key, claims, 1, ttl)
	return nil
}

func (c *RistrettoAuthCache) GetAccessTokenClaims(ctx context.Context, token string) (AccessTokenClaims, bool, error) {
	key := "claims:" + secureKey(token)
	val, ok := c.cache.Get(key)
	if !ok {
		return AccessTokenClaims{}, false, nil
	}
	claims, ok := val.(AccessTokenClaims)
	return claims, ok, nil
}

func (c *RistrettoAuthCache) BlacklistAccessTokenJTI(ctx context.Context, jti string, ttl time.Duration) error {
	key := "bl:jti:" + secureKey(jti)
	c.cache.SetWithTTL(key, struct{}{}, 1, ttl)
	return nil
}

func (c *RistrettoAuthCache) IsAccessTokenJTIBlacklisted(ctx context.Context, jti string) (bool, error) {
	key := "bl:jti:" + secureKey(jti)
	_, ok := c.cache.Get(key)
	return ok, nil
}

func (c *RistrettoAuthCache) SetAPIKeyValidation(ctx context.Context, rawKey string, validation APIKeyValidation, ttl time.Duration) error {
	key := "ak:" + secureKey(rawKey)
	c.cache.SetWithTTL(key, validation, 1, ttl)
	return nil
}

func (c *RistrettoAuthCache) GetAPIKeyValidation(ctx context.Context, rawKey string) (APIKeyValidation, bool, error) {
	key := "ak:" + secureKey(rawKey)
	val, ok := c.cache.Get(key)
	if !ok {
		return APIKeyValidation{}, false, nil
	}
	v, ok := val.(APIKeyValidation)
	return v, ok, nil
}

func (c *RistrettoAuthCache) RevokeAPIKeyPrefix(ctx context.Context, prefix string, ttl time.Duration) error {
	key := "rev:" + secureKey(prefix)
	c.cache.SetWithTTL(key, struct{}{}, 1, ttl)
	return nil
}

func (c *RistrettoAuthCache) IsAPIKeyPrefixRevoked(ctx context.Context, prefix string) (bool, error) {
	key := "rev:" + secureKey(prefix)
	_, ok := c.cache.Get(key)
	return ok, nil
}

func (c *RistrettoAuthCache) Get(ctx context.Context, key string) (string, error) {
	val, ok := c.cache.Get("gen:" + key)
	if !ok {
		return "", ErrCacheMiss
	}
	s, ok := val.(string)
	if !ok {
		return "", fmt.Errorf("value is not a string")
	}
	return s, nil
}

func (c *RistrettoAuthCache) Set(ctx context.Context, key string, value string, ttl time.Duration) error {
	c.cache.SetWithTTL("gen:"+key, value, 1, ttl)
	return nil
}

func (c *RistrettoAuthCache) Delete(ctx context.Context, key string) error {
	c.cache.Del("gen:" + key)
	return nil
}

func secureKey(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
