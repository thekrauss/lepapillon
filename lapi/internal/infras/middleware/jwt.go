package middleware

import (
	"fmt"

	"github.com/golang-jwt/jwt/v5"
)

// UserClaims is the JWT claims structure used across the app.
type UserClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// ParseJWT validates a JWT token string and returns the claims.
// H1+H2 FIX: validates issuer and audience.
func ParseJWT(tokenStr string, secret string) (*UserClaims, error) {
	claims := &UserClaims{}
	token, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
		}
		return []byte(secret), nil
	},
		jwt.WithIssuer("lepapillon"),
		jwt.WithAudience("lepapillon-api"),
		jwt.WithValidMethods([]string{"HS256"}),
	)
	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid token: %w", err)
	}
	return claims, nil
}
