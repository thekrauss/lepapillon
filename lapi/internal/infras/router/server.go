package router

import (
	"context"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/wI2L/fizz"
)

type Server struct {
	HTTP *http.Server
}

const corsAllowedHeaders = "Origin,Content-Type,Accept,Authorization,X-Idempotency-Key"

// BuildHTTPServer wires the gin+fizz engine with swagger and all registered routes.
func BuildHTTPServer(cfg *config.GlobalConfig, mw *middleware.Manager) (*http.Server, error) {
	if cfg == nil {
		return nil, fmt.Errorf("config is required")
	}

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()
	engine.Use(gin.Recovery())
	engine.Use(simpleCORS(cfg.Server.AllowedOrigins))
	engine.Use(middleware.RateLimitMiddleware(cfg.RateLimit))

	// ── Health ───────────────────────────────────────────────────
	engine.GET("/api/v1/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": cfg.ServiceName,
		})
	})

	// ── Fizz + OpenAPI schema ────────────────────────────────────
	f := fizz.NewFromEngine(engine)
	l := logrus.NewEntry(logrus.StandardLogger())
	if err := RegisterSchema(f, "Saveurs Thaï API", "API e-commerce cuisine thaïlandaise & prestation chef", l); err != nil {
		return nil, err
	}

	// ── Module routes via fizz ───────────────────────────────────
	if err := RegisterRoutes(f, mw); err != nil {
		return nil, err
	}

	addr := fmt.Sprintf(":%d", cfg.Server.HTTPPort)
	return &http.Server{
		Addr:         addr,
		Handler:      engine,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}, nil
}

// StartHTTPServer builds and starts the server in a goroutine.
func StartHTTPServer(cfg *config.GlobalConfig, mw *middleware.Manager) (*http.Server, error) {
	srv, err := BuildHTTPServer(cfg, mw)
	if err != nil {
		return nil, err
	}

	go func() {
		logrus.Infof("HTTP server listening on %s", srv.Addr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logrus.WithError(err).Error("http server terminated unexpectedly")
		}
	}()

	return srv, nil
}

// GracefulShutdown stops the HTTP server with timeout.
func GracefulShutdown(ctx context.Context, httpServer *http.Server, timeout time.Duration) error {
	if httpServer == nil {
		return nil
	}
	if timeout == 0 {
		timeout = 10 * time.Second
	}
	shutdownCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()
	logrus.Info("Shutting down HTTP server...")
	return httpServer.Shutdown(shutdownCtx)
}

// simpleCORS is a minimal CORS handler matching gophercart's pattern.
func simpleCORS(allowedOrigins []string) gin.HandlerFunc {
	allowAll := false
	allowed := map[string]struct{}{}
	for _, o := range allowedOrigins {
		o = strings.TrimSpace(strings.ToLower(strings.TrimRight(o, "/")))
		if o == "*" {
			allowAll = true
			continue
		}
		if o != "" {
			allowed[o] = struct{}{}
		}
	}

	return func(c *gin.Context) {
		origin := strings.TrimSpace(strings.ToLower(strings.TrimRight(c.GetHeader("Origin"), "/")))

		if allowAll {
			c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		} else if _, ok := allowed[origin]; ok && origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Vary", "Origin")
		}

		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", corsAllowedHeaders)

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		c.Next()
	}
}
