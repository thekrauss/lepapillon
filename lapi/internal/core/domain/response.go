package domain

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	Success bool   `json:"success"`
	Data    any    `json:"data,omitempty"`
	Error   *APIError `json:"error,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func WriteJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(APIResponse{
		Success: status >= 200 && status < 300,
		Data:    data,
	})
}

func WriteError(w http.ResponseWriter, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(appErr.Status)
		json.NewEncoder(w).Encode(APIResponse{
			Success: false,
			Error: &APIError{
				Code:    appErr.Code,
				Message: appErr.Message,
			},
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusInternalServerError)
	json.NewEncoder(w).Encode(APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "INTERNAL_ERROR",
			Message: "erreur interne du serveur",
		},
	})
}

// ── Gin helpers ─────────────────────────────────────────────────────

// AbortWithError aborts the Gin context with a JSON error response.
func AbortWithError(c *gin.Context, err error) {
	var appErr *AppError
	if errors.As(err, &appErr) {
		c.AbortWithStatusJSON(appErr.Status, APIResponse{
			Success: false,
			Error: &APIError{
				Code:    appErr.Code,
				Message: appErr.Message,
			},
		})
		return
	}
	c.AbortWithStatusJSON(http.StatusInternalServerError, APIResponse{
		Success: false,
		Error: &APIError{
			Code:    "INTERNAL_ERROR",
			Message: "erreur interne du serveur",
		},
	})
}

// RespondJSON writes a success JSON response via Gin.
func RespondJSON(c *gin.Context, status int, data any) {
	c.JSON(status, APIResponse{
		Success: status >= 200 && status < 300,
		Data:    data,
	})
}
