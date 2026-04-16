package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// M1 FIX: per-IP rate limiter for authentication endpoints.
// Uses a simple sliding-window counter per IP address.

type ipEntry struct {
	count    int
	windowAt time.Time
}

type AuthRateLimiter struct {
	mu      sync.Mutex
	entries map[string]*ipEntry
	limit   int
	window  time.Duration
}

func NewAuthRateLimiter(limit int, window time.Duration) *AuthRateLimiter {
	if limit <= 0 {
		limit = 10 // 10 attempts per window
	}
	if window <= 0 {
		window = time.Minute
	}
	return &AuthRateLimiter{
		entries: make(map[string]*ipEntry),
		limit:   limit,
		window:  window,
	}
}

// Middleware returns a Gin middleware that rate-limits by client IP.
func (rl *AuthRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		now := time.Now()

		rl.mu.Lock()
		entry, exists := rl.entries[ip]
		if !exists || now.Sub(entry.windowAt) > rl.window {
			rl.entries[ip] = &ipEntry{count: 1, windowAt: now}
			rl.mu.Unlock()
			c.Next()
			return
		}
		entry.count++
		count := entry.count
		rl.mu.Unlock()

		if count > rl.limit {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":   "TOO_MANY_REQUESTS",
				"message": "trop de tentatives, réessayez dans quelques minutes",
			})
			return
		}
		c.Next()
	}
}
