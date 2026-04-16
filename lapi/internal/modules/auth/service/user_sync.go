package service

import (
	"context"
	"strings"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
)

// UserSyncService syncs OIDC users to the local database on every request.
// Same pattern as gophercart's UserSyncService.
type UserSyncService struct {
	userRepo authdomain.UserRepository
}

func NewUserSyncService(userRepo authdomain.UserRepository) *UserSyncService {
	return &UserSyncService{userRepo: userRepo}
}

// SyncOIDCUser ensures the OIDC principal has a corresponding local User record.
// Creates the user if not found, updates email/last login if found.
// Returns the local UUID.
func (s *UserSyncService) SyncOIDCUser(ctx context.Context, principal *Principal) (uuid.UUID, error) {
	if principal == nil || strings.TrimSpace(principal.UserID) == "" {
		return uuid.Nil, nil
	}

	email := strings.ToLower(strings.TrimSpace(principal.Email))

	// Determine role from OIDC token
	oidcRole := "client"
	for _, r := range principal.Roles {
		if strings.EqualFold(r, "admin") {
			oidcRole = "admin"
			break
		}
	}

	// 1. Try to find by Keycloak ID
	user, err := s.userRepo.GetByKeycloakID(ctx, principal.UserID)
	if err == nil && user != nil {
		dirty := false
		if email != "" && user.Email != email {
			user.Email = email
			dirty = true
		}
		if oidcRole == "admin" && user.Role != "admin" {
			user.Role = "admin"
			dirty = true
		}
		if dirty {
			_ = s.userRepo.Update(ctx, user)
		}
		return user.ID, nil
	}

	// 2. Try to find by email
	if email != "" {
		user, err = s.userRepo.GetByEmail(ctx, email)
		if err == nil && user != nil {
			// Link Keycloak ID
			user.KeycloakUserID = principal.UserID
			_ = s.userRepo.Update(ctx, user)
			return user.ID, nil
		}
	}

	// 3. Create new user
	firstName, lastName := displayNameFromEmail(email)
	newUser := &authdomain.User{
		ID:              uuid.New(),
		KeycloakUserID:  principal.UserID,
		Email:           email,
		FirstName:       firstName,
		LastName:        lastName,
		Role:            oidcRole,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.userRepo.Create(ctx, newUser); err != nil {
		logrus.WithError(err).WithField("email", email).Warn("failed to create local user from OIDC")
		return uuid.Nil, err
	}

	logrus.WithFields(logrus.Fields{
		"user_id":     newUser.ID,
		"keycloak_id": principal.UserID,
		"email":       email,
	}).Info("synced new OIDC user to local database")

	return newUser.ID, nil
}

func displayNameFromEmail(email string) (string, string) {
	if email == "" {
		return "", ""
	}
	parts := strings.SplitN(email, "@", 2)
	if len(parts) == 0 {
		return "", ""
	}
	local := strings.ReplaceAll(parts[0], ".", " ")
	nameParts := strings.Fields(local)
	switch len(nameParts) {
	case 0:
		return "", ""
	case 1:
		return capitalize(nameParts[0]), ""
	default:
		return capitalize(nameParts[0]), capitalize(strings.Join(nameParts[1:], " "))
	}
}

func capitalize(s string) string {
	if s == "" {
		return ""
	}
	runes := []rune(s)
	runes[0] = unicode.ToUpper(runes[0])
	return string(runes)
}
