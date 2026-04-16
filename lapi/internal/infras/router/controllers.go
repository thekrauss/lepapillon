package router

import (
	authdomain "github.com/thekrauss/lepapillon/internal/modules/auth/domain"
	authsvc "github.com/thekrauss/lepapillon/internal/modules/auth/service"
	backofficeuc "github.com/thekrauss/lepapillon/internal/modules/backoffice/usecase"
	cataloguerepo "github.com/thekrauss/lepapillon/internal/modules/catalogue/repository"
	catalogueuc "github.com/thekrauss/lepapillon/internal/modules/catalogue/usecase"
	checkoutrepo "github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	checkoutuc "github.com/thekrauss/lepapillon/internal/modules/checkout/usecase"
	identitysvc "github.com/thekrauss/lepapillon/internal/modules/identity/services"
	panierrepo "github.com/thekrauss/lepapillon/internal/modules/panier/repository"
	panieruc "github.com/thekrauss/lepapillon/internal/modules/panier/usecase"
	paymenthandler "github.com/thekrauss/lepapillon/internal/modules/payment"
	paymentrepo "github.com/thekrauss/lepapillon/internal/modules/payment/repository"
	paymentsvc "github.com/thekrauss/lepapillon/internal/modules/payment/services"
	prestationrepo "github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
	prestationuc "github.com/thekrauss/lepapillon/internal/modules/prestation/usecase"
	settingssvc "github.com/thekrauss/lepapillon/internal/modules/settings"
	settingsrepo "github.com/thekrauss/lepapillon/internal/modules/settings/repository"

	authhandler "github.com/thekrauss/lepapillon/internal/modules/auth"
	backofficehandler "github.com/thekrauss/lepapillon/internal/modules/backoffice"
	cataloguehandler "github.com/thekrauss/lepapillon/internal/modules/catalogue"
	checkouthandler "github.com/thekrauss/lepapillon/internal/modules/checkout"
	identityhandler "github.com/thekrauss/lepapillon/internal/modules/identity"
	panierhandler "github.com/thekrauss/lepapillon/internal/modules/panier"
	prestationhandler "github.com/thekrauss/lepapillon/internal/modules/prestation"
)

// RepositoryContainer holds all data-access implementations.
type RepositoryContainer struct {
	AuthUser     authdomain.UserRepository
	AuthAddress  authdomain.AddressRepository
	AuthRefresh  authdomain.RefreshTokenRepository
	Catalogue    cataloguerepo.CatalogueRepository
	Panier       panierrepo.PanierRepository
	Checkout     checkoutrepo.CheckoutRepository
	Prestation   prestationrepo.PrestationRepository
	Settings     settingsrepo.SettingsRepository
	PaymentEvent paymentrepo.Repository
}

// ServiceContainer holds all domain services / use-cases.
type ServiceContainer struct {
	Auth        *authsvc.AuthService
	AuthSync    *authsvc.UserSyncService
	Identity    identitysvc.Service
	Catalogue   catalogueuc.ICatalogueUseCase
	Panier      panieruc.IPanierUseCase
	Checkout    checkoutuc.ICheckoutUseCase
	Prestation  prestationuc.IPrestationUseCase
	Backoffice  backofficeuc.IBackofficeUseCase
	Settings    settingssvc.Service
	Payment     paymentsvc.Service
}

// ControllerContainer holds all HTTP handlers (Gin controllers).
type ControllerContainer struct {
	Auth        authhandler.IAuthController
	Identity    identityhandler.Controller
	Catalogue   cataloguehandler.ICatalogueController
	Panier      panierhandler.IPanierController
	Checkout    checkouthandler.ICheckoutController
	Prestation  prestationhandler.IPrestationController
	Backoffice  backofficehandler.IBackofficeController
	Payment     paymenthandler.IPaymentController
}

// AddAllRoutes registers every module's routes on the Gin engine.
func AddAllRoutes(a *App) {
	if a == nil {
		return
	}
	addIdentityRoutes(a)
	addAuthRoutes(a)
	addCatalogueRoutes(a)
	addPanierRoutes(a)
	addCheckoutRoutes(a)
	addPrestationRoutes(a)
	addPaymentRoutes(a)
	addBackofficeRoutes(a)
	addWebhookRoutes(a)
}
