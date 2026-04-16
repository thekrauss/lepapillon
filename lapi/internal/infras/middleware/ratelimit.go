package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/core/config"
	"golang.org/x/time/rate"
)

// RateLimitMiddleware returns a Gin middleware that enforces a global rate limit.
func RateLimitMiddleware(cfg config.RateLimitConfig) gin.HandlerFunc {
	if !cfg.Enabled {
		return func(c *gin.Context) { c.Next() }
	}

	limiter := rate.NewLimiter(rate.Limit(cfg.Limit), cfg.Burst)

	return func(c *gin.Context) {
		if !limiter.Allow() {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"success": false,
				"error": gin.H{
					"code":    "TOO_MANY_REQUESTS",
					"message": "trop de requêtes",
				},
			})
			return
		}
		c.Next()
	}
}
