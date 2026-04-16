package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/thekrauss/lepapillon/internal/core/config"
	"github.com/thekrauss/lepapillon/internal/core/domain"
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo  authdomain.UserRepository
	addrRepo  authdomain.AddressRepository
	tokenRepo authdomain.RefreshTokenRepository
	jwtCfg    config.JWTConfig
}

func NewAuthService(
	userRepo authdomain.UserRepository,
	addrRepo authdomain.AddressRepository,
	tokenRepo authdomain.RefreshTokenRepository,
	jwtCfg config.JWTConfig,
) *AuthService {
	return &AuthService{
		userRepo:  userRepo,
		addrRepo:  addrRepo,
		tokenRepo: tokenRepo,
		jwtCfg:    jwtCfg,
	}
}

// ── Register

func (s *AuthService) Register(ctx context.Context, req RegisterRequest) (*RegisterResponse, error) {
	// H6 FIX: normalize email to lowercase before any operation
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// M2 FIX: bcrypt truncates at 72 bytes — reject overly long passwords
	if len(req.Password) > 72 {
		return nil, domain.ErrBadRequest.WithMessage("mot de passe trop long (max 72 caractères)")
	}

	exists, err := s.userRepo.ExistsByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, domain.ErrConflict.WithMessage("cet email est déjà utilisé")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &authdomain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: string(hash),
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        req.Phone,
		Role:         "client", // or use the correct constant name from authdomain
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return &RegisterResponse{UserID: user.ID}, nil
}

// ── Login ───

func (s *AuthService) Login(ctx context.Context, req LoginRequest) (*TokenResponse, error) {
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	user, err := s.userRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrUnauthorized.WithMessage("email ou mot de passe incorrect")
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, domain.ErrUnauthorized.WithMessage("email ou mot de passe incorrect")
	}

	return s.generateTokenPair(ctx, user)
}

// ── Refresh ─

func (s *AuthService) Refresh(ctx context.Context, req RefreshRequest) (*TokenResponse, error) {
	hash := hashToken(req.RefreshToken)

	// C2 FIX: atomic consume — DELETE ... RETURNING * in a single SQL statement.
	// First caller wins; concurrent callers get ErrNotFound → 401.
	stored, err := s.tokenRepo.ConsumeByTokenHash(ctx, hash)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return nil, domain.ErrUnauthorized.WithMessage("refresh token invalid or already consumed")
		}
		return nil, err
	}

	if time.Now().After(stored.ExpiresAt) {
		return nil, domain.ErrUnauthorized.WithMessage("refresh token expired")
	}

	user, err := s.userRepo.GetByID(ctx, stored.UserID)
	if err != nil {
		return nil, err
	}

	return s.generateTokenPair(ctx, user)
}

// ── Logout ──

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	hash := hashToken(refreshToken)
	return s.tokenRepo.DeleteByTokenHash(ctx, hash)
}

func (s *AuthService) LogoutAll(ctx context.Context, userID uuid.UUID) error {
	return s.tokenRepo.DeleteAllByUserID(ctx, userID)
}

// ── Profile ─

func (s *AuthService) GetProfile(ctx context.Context, userID uuid.UUID) (*ProfileResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	addresses, err := s.addrRepo.ListByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}

	resp := ToProfileResponse(user, addresses)
	return &resp, nil
}

func (s *AuthService) UpdateProfile(ctx context.Context, userID uuid.UUID, req UpdateProfileRequest) (*ProfileResponse, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	if req.FirstName != nil {
		user.FirstName = *req.FirstName
	}
	if req.LastName != nil {
		user.LastName = *req.LastName
	}
	if req.Phone != nil {
		user.Phone = *req.Phone
	}

	if err := s.userRepo.Update(ctx, user); err != nil {
		return nil, err
	}

	return s.GetProfile(ctx, userID)
}

// ── Addresses ───────────────────────────────────────────────────────

func (s *AuthService) CreateAddress(ctx context.Context, userID uuid.UUID, req CreateAddressRequest) (*AddressResponse, error) {
	if req.IsDefault {
		if err := s.addrRepo.ClearDefaults(ctx, userID); err != nil {
			return nil, err
		}
	}

	addr := &authdomain.Address{
		ID:         uuid.New(),
		UserID:     userID,
		Label:      req.Label,
		Street:     req.Street,
		City:       req.City,
		PostalCode: req.PostalCode,
		IsDefault:  req.IsDefault,
	}

	if err := s.addrRepo.Create(ctx, addr); err != nil {
		return nil, err
	}

	resp := ToAddressResponse(addr)
	return &resp, nil
}

func (s *AuthService) UpdateAddress(ctx context.Context, userID uuid.UUID, addrID uuid.UUID, req UpdateAddressRequest) (*AddressResponse, error) {
	addr, err := s.addrRepo.GetByID(ctx, addrID)
	if err != nil {
		return nil, err
	}
	if addr.UserID != userID {
		return nil, domain.ErrForbidden
	}

	if req.Label != nil {
		addr.Label = *req.Label
	}
	if req.Street != nil {
		addr.Street = *req.Street
	}
	if req.City != nil {
		addr.City = *req.City
	}
	if req.PostalCode != nil {
		addr.PostalCode = *req.PostalCode
	}
	if req.IsDefault != nil && *req.IsDefault {
		if err := s.addrRepo.ClearDefaults(ctx, userID); err != nil {
			return nil, err
		}
		addr.IsDefault = true
	}

	if err := s.addrRepo.Update(ctx, addr); err != nil {
		return nil, err
	}

	resp := ToAddressResponse(addr)
	return &resp, nil
}

func (s *AuthService) DeleteAddress(ctx context.Context, userID uuid.UUID, addrID uuid.UUID) error {
	addr, err := s.addrRepo.GetByID(ctx, addrID)
	if err != nil {
		return err
	}
	if addr.UserID != userID {
		return domain.ErrForbidden
	}
	return s.addrRepo.Delete(ctx, addrID)
}

// ── Token helpers ───────────────────────────────────────────────────

func (s *AuthService) generateTokenPair(ctx context.Context, user *authdomain.User) (*TokenResponse, error) {
	accessExpiry := s.jwtCfg.AccessExpiry
	if accessExpiry == 0 {
		accessExpiry = 15 * time.Minute
	}

	now := time.Now()
	claims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"email":   user.Email,
		"role":    user.Role,
		"iss":     "lepapillon",
		"aud":     "lepapillon-api",
		"exp":     now.Add(accessExpiry).Unix(),
		"iat":     now.Unix(),
		"nbf":     now.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	accessToken, err := token.SignedString([]byte(s.jwtCfg.Secret))
	if err != nil {
		return nil, fmt.Errorf("sign access token: %w", err)
	}

	// Generate refresh token
	rawRefresh, err := generateRandomToken(32)
	if err != nil {
		return nil, err
	}

	refreshExpiry := s.jwtCfg.RefreshExpiry
	if refreshExpiry == 0 {
		refreshExpiry = 7 * 24 * time.Hour
	}

	rt := &authdomain.RefreshToken{
		ID:        uuid.New(),
		UserID:    user.ID,
		TokenHash: hashToken(rawRefresh),
		ExpiresAt: time.Now().Add(refreshExpiry),
	}

	if err := s.tokenRepo.Create(ctx, rt); err != nil {
		return nil, err
	}

	return &TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: rawRefresh,
		ExpiresIn:    int(accessExpiry.Seconds()),
	}, nil
}

func generateRandomToken(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate random token: %w", err)
	}
	return hex.EncodeToString(b), nil
}

func hashToken(token string) string {
	h := sha256.Sum256([]byte(token))
	return hex.EncodeToString(h[:])
}
