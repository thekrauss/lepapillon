package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/infras/idempotency"
)

var globalIdempotencyManager idempotency.Manager

// SetIdempotencyManager sets the global idempotency manager used by the
// Idempotency() middleware. Must be called before serving requests.
func SetIdempotencyManager(mgr idempotency.Manager, _ interface{}) {
	globalIdempotencyManager = mgr
}

// idempotencyResponse is the cached response structure.
type idempotencyResponse struct {
	Status int             `json:"status"`
	Body   json.RawMessage `json:"body"`
}

// Idempotency returns a Gin middleware that enforces idempotent writes via
// the "X-Idempotency-Key" header. If a matching key+payload is found in
// the cache, the cached response is returned without executing the handler.
func Idempotency() gin.HandlerFunc {
	return func(c *gin.Context) {
		if globalIdempotencyManager == nil {
			c.Next()
			return
		}

		key := strings.TrimSpace(c.GetHeader("X-Idempotency-Key"))
		if key == "" {
			// No idempotency key provided — execute normally.
			c.Next()
			return
		}

		// Hash the request body for payload matching.
		var bodyBytes []byte
		if c.Request.Body != nil {
			bodyBytes, _ = io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
		}
		payloadHash, err := globalIdempotencyManager.Hash(bodyBytes, c.Request.Method, c.Request.URL.Path)
		if err != nil {
			c.Next()
			return
		}

		// Check cache for existing response.
		var cached idempotencyResponse
		found, err := globalIdempotencyManager.Lookup(c.Request.Context(), key, payloadHash, &cached)
		if err != nil {
			logrus.WithError(err).Warn("idempotency lookup failed, proceeding without cache")
			c.Next()
			return
		}
		if found {
			// Return cached response — skip handler execution.
			c.Data(cached.Status, "application/json", cached.Body)
			c.Abort()
			return
		}

		// Capture the response for caching.
		recorder := &responseRecorder{ResponseWriter: c.Writer, body: &bytes.Buffer{}}
		c.Writer = recorder

		c.Next()

		// Store the response if the handler succeeded (2xx).
		status := recorder.Status()
		if status >= 200 && status < 300 {
			resp := idempotencyResponse{
				Status: status,
				Body:   recorder.body.Bytes(),
			}
			if err := globalIdempotencyManager.Store(c.Request.Context(), key, payloadHash, resp); err != nil {
				logrus.WithError(err).Warn("idempotency store failed")
			}
		}
	}
}

// responseRecorder captures the response body and status code.
type responseRecorder struct {
	gin.ResponseWriter
	body       *bytes.Buffer
	statusCode int
}

func (r *responseRecorder) Write(b []byte) (int, error) {
	r.body.Write(b)
	return r.ResponseWriter.Write(b)
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}

func (r *responseRecorder) Status() int {
	if r.statusCode == 0 {
		return http.StatusOK
	}
	return r.statusCode
}
