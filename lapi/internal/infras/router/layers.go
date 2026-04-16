package router

import (
	"fmt"
	"strings"

	"github.com/redis/go-redis/v9"
	"github.com/sirupsen/logrus"
	authCtrl "github.com/thekrauss/lepapillon/internal/modules/auth"
	authrepo "github.com/thekrauss/lepapillon/internal/modules/auth/repository"
	authsvc "github.com/thekrauss/lepapillon/internal/modules/auth/service"
	catalogueCtrl "github.com/thekrauss/lepapillon/internal/modules/catalogue"
	cataloguerepo "github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	catalogueuc "github.com/thekrauss/lepapillon/internal/modules/catalogue/usecase"
	identityCtrl "github.com/thekrauss/lepapillon/internal/modules/identity"
	identitykeycloak "github.com/thekrauss/lepapillon/internal/modules/identity/keycloak"
	identitysvc "github.com/thekrauss/lepapillon/internal/modules/identity/services"
	panierCtrl "github.com/thekrauss/lepapillon/internal/modules/panier"
	panierrepo "github.com/thekrauss/lepapillon/internal/modules/panier/repository"
	panieruc "github.com/thekrauss/lepapillon/internal/modules/panier/usecase"
	checkoutCtrl "github.com/thekrauss/lepapillon/internal/modules/checkout"
	checkoutrepo "github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	checkoutuc "github.com/thekrauss/lepapillon/internal/modules/checkout/usecase"
	prestationCtrl "github.com/thekrauss/lepapillon/internal/modules/prestation"
	prestationrepo "github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
	prestationuc "github.com/thekrauss/lepapillon/internal/modules/prestation/usecase"
	backofficeCtrl "github.com/thekrauss/lepapillon/internal/modules/backoffice"
	backofficeuc "github.com/thekrauss/lepapillon/internal/modules/backoffice/usecase"
	paymentCtrl "github.com/thekrauss/lepapillon/internal/modules/payment"
	paymentrepo "github.com/thekrauss/lepapillon/internal/modules/payment/repository"
	paymentsvc "github.com/thekrauss/lepapillon/internal/modules/payment/services"
	settingssvc "github.com/thekrauss/lepapillon/internal/modules/settings"
	settingsrepo "github.com/thekrauss/lepapillon/internal/modules/settings/repository"
)

// initDomainLayers wires repos → services → controllers, exactly like gophercart.
func (a *App) initDomainLayers() error {
	if a.DB == nil {
		return fmt.Errorf("database is required")
	}

	// ── Repositories ────────────────────────────────────────────────
	userRepo := authrepo.NewGormUserRepository(a.DB)
	addressRepo := authrepo.NewGormAddressRepository(a.DB)
	refreshRepo := authrepo.NewGormRefreshTokenRepository(a.DB)
	catalogueRepo := cataloguerepo.NewCatalogueRepository(a.DB)

	a.Repos = &RepositoryContainer{
		AuthUser:    userRepo,
		AuthAddress: addressRepo,
		AuthRefresh: refreshRepo,
		Catalogue:   catalogueRepo,
	}

	// ── Auth Service ────────────────────────────────────────────────
	authService := authsvc.NewAuthService(userRepo, addressRepo, refreshRepo, a.Config.JWT)
	userSyncService := authsvc.NewUserSyncService(userRepo)

	// ── Keycloak + Identity Service ─────────────────────────────────
	var keycloakClient identitykeycloak.KeycloakClient
	var identityService identitysvc.Service

	if a.Config.OIDC.Enabled {
		adminClientID := strings.TrimSpace(a.Config.OIDC.AdminClientID)
		if adminClientID == "" {
			adminClientID = strings.TrimSpace(a.Config.OIDC.ClientID)
		}

		if strings.TrimSpace(a.Config.OIDC.AdminClientSecret) != "" && adminClientID != "" {
			client, err := identitykeycloak.New(identitykeycloak.AdminConfig{
				BaseURL:      strings.TrimSpace(a.Config.OIDC.AdminBaseURL),
				Realm:        strings.TrimSpace(a.Config.OIDC.AdminRealm),
				ClientID:     adminClientID,
				ClientSecret: strings.TrimSpace(a.Config.OIDC.AdminClientSecret),
				Timeout:      a.Config.OIDC.HTTPTimeout,
			}, a.Config.OIDC.Issuer)
			if err != nil {
				return fmt.Errorf("init keycloak admin client: %w", err)
			}
			keycloakClient = client
			// Set user client for ROPC auth (separate from admin client)
			userClientID := strings.TrimSpace(a.Config.OIDC.ClientID)
			userClientSecret := strings.TrimSpace(a.Config.OIDC.ClientSecret)
			if userClientID != "" {
				client.SetUserClient(userClientID, userClientSecret)
			}
			logrus.Info("Keycloak admin client initialized")
		}

		if keycloakClient != nil {
			frontendBaseURL := strings.TrimSpace(a.Config.Frontend.BaseURL)
			if frontendBaseURL == "" {
				frontendBaseURL = strings.TrimSpace(a.Config.Server.PublicBaseURL)
			}
			identityService = identitysvc.NewService(identitysvc.Deps{
				Keycloak:        keycloakClient,
				FrontendBaseURL: frontendBaseURL,
				OIDCClientID:    strings.TrimSpace(a.Config.OIDC.ClientID),
			})
		}
	}

	// ── Catalogue ───────────────────────────────────────────────────
	catalogueUC := catalogueuc.NewCatalogueUseCase(catalogueRepo)

	// ── Settings ────────────────────────────────────────────────────
	settingsRepo := settingsrepo.NewSettingsRepository(a.DB)
	settingsService := settingssvc.NewService(settingsRepo)

	// ── Panier (Redis-backed cart) ──────────────────────────────────
	redisClient := redis.NewClient(a.redisOptions())
	panierRepo := panierrepo.NewRedisPanierRepository(redisClient)
	panierUC := panieruc.NewPanierUseCase(panierRepo, catalogueRepo, settingsService)

	// ── Prestation ──────────────────────────────────────────────────
	prestationRepo := prestationrepo.NewPrestationRepository(a.DB)
	prestationUC := prestationuc.NewPrestationUseCase(prestationRepo)

	// ── Checkout ────────────────────────────────────────────────────
	checkoutRepo := checkoutrepo.NewCheckoutRepository(a.DB)
	checkoutUC := checkoutuc.NewCheckoutUseCase(checkoutRepo, panierRepo, userRepo, prestationRepo, a.Distributor)

	// ── Backoffice ──────────────────────────────────────────────────
	backofficeUC := backofficeuc.NewBackofficeUseCase(a.DB, checkoutRepo, prestationRepo, settingsService)

	// ── Payment (Stripe) ────────────────────────────────────────────
	paymentEventRepo := paymentrepo.NewRepository(a.DB)
	var paymentService paymentsvc.Service
	var paymentController paymentCtrl.IPaymentController
	stripeSvc, stripeErr := paymentsvc.NewStripeService(a.Config.Payment)
	if stripeErr == nil {
		paymentService = stripeSvc
		paymentController = paymentCtrl.NewPaymentController(stripeSvc, checkoutRepo)
		logrus.Info("Stripe payment service initialized")
	} else {
		logrus.Warnf("Stripe payment service not configured: %v", stripeErr)
	}

	// ── Wire containers ─────────────────────────────────────────────
	a.Repos = &RepositoryContainer{
		AuthUser:     userRepo,
		AuthAddress:  addressRepo,
		AuthRefresh:  refreshRepo,
		Catalogue:    catalogueRepo,
		Panier:       panierRepo,
		Checkout:     checkoutRepo,
		Prestation:   prestationRepo,
		Settings:     settingsRepo,
		PaymentEvent: paymentEventRepo,
	}

	a.Services = &ServiceContainer{
		Auth:       authService,
		AuthSync:   userSyncService,
		Identity:   identityService,
		Catalogue:  catalogueUC,
		Panier:     panierUC,
		Checkout:   checkoutUC,
		Prestation: prestationUC,
		Backoffice: backofficeUC,
		Settings:   settingsService,
		Payment:    paymentService,
	}

	var identityController identityCtrl.Controller
	if identityService != nil {
		identityController = identityCtrl.NewController(identityService, a.Cache)
	}

	a.Controllers = &ControllerContainer{
		Auth:       authCtrl.NewAuthController(authService),
		Identity:   identityController,
		Catalogue:  catalogueCtrl.NewCatalogueController(catalogueUC),
		Panier:     panierCtrl.NewPanierController(panierUC),
		Checkout:   checkoutCtrl.NewCheckoutController(checkoutUC, panierRepo),
		Prestation: prestationCtrl.NewPrestationController(prestationUC),
		Backoffice: backofficeCtrl.NewBackofficeController(backofficeUC),
		Payment:    paymentController,
	}

	return nil
}
