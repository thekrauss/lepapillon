package domain

import (
	"fmt"
	"net/http"
)

type AppError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Status  int    `json:"-"`
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func NewAppError(code string, message string, status int) *AppError {
	return &AppError{Code: code, Message: message, Status: status}
}

// Common errors
var (
	ErrNotFound       = NewAppError("NOT_FOUND", "ressource introuvable", http.StatusNotFound)
	ErrUnauthorized   = NewAppError("UNAUTHORIZED", "authentification requise", http.StatusUnauthorized)
	ErrForbidden      = NewAppError("FORBIDDEN", "accès interdit", http.StatusForbidden)
	ErrBadRequest     = NewAppError("BAD_REQUEST", "requête invalide", http.StatusBadRequest)
	ErrConflict       = NewAppError("CONFLICT", "conflit de données", http.StatusConflict)
	ErrInternal       = NewAppError("INTERNAL_ERROR", "erreur interne du serveur", http.StatusInternalServerError)
	ErrValidation     = NewAppError("VALIDATION_ERROR", "données invalides", http.StatusUnprocessableEntity)
	ErrTooManyRequests = NewAppError("TOO_MANY_REQUESTS", "trop de requêtes", http.StatusTooManyRequests)
)

// WithMessage returns a copy of the error with a custom message.
func (e *AppError) WithMessage(msg string) *AppError {
	return &AppError{Code: e.Code, Message: msg, Status: e.Status}
}

// HTTPStatus returns the HTTP status code (used by handlers for error mapping).
func (e *AppError) HTTPStatus() int { return e.Status }

// ErrorCode returns the machine-readable error code.
func (e *AppError) ErrorCode() string { return e.Code }
