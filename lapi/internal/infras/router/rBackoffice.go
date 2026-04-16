package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/modules/backoffice/types"
	settingstypes "github.com/thekrauss/lepapillon/internal/modules/settings/types"
)

var (
	BackofficeGroup    = RootGroup.NewGroup("/admin", "Back-office gérante")
	BackofficeSettings = BackofficeGroup.NewGroup("/settings", "Paramètres")
)

func addBackofficeRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Backoffice == nil {
		return
	}
	ctrl := a.Controllers.Backoffice

	BackofficeGroup.Middlewares = append(BackofficeGroup.Middlewares, middleware.RequireRole("admin"))

	BackofficeGroup.AddRoute("/dashboard", http.MethodGet, "Tableau de bord", tonic.Handler(ctrl.GetDashboard, http.StatusOK)).
		AddResponse(http.StatusOK, "Stats dashboard", &types.DashboardResponse{})

	BackofficeGroup.AddRoute("/orders", http.MethodGet, "Lister les commandes", tonic.Handler(ctrl.ListOrders, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des commandes", []types.RecentOrderEntry{})

	BackofficeGroup.AddRoute("/orders/:orderId/status", http.MethodPut, "Changer le statut d'une commande", tonic.Handler(ctrl.UpdateOrderStatus, http.StatusNoContent)).
		AddPayload(&types.UpdateOrderStatusRequest{}).
		AddIdempotency()

	BackofficeGroup.AddRoute("/clients", http.MethodGet, "Lister les clients", tonic.Handler(ctrl.ListClients, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des clients", []types.ClientEntry{})

	BackofficeGroup.AddRoute("/bookings", http.MethodGet, "Reservations prestations avec details", tonic.Handler(ctrl.ListBookingDetails, http.StatusOK)).
		AddResponse(http.StatusOK, "Reservations enrichies", []types.BookingDetailResponse{})

	BackofficeGroup.AddRoute("/slots", http.MethodGet, "Tous les creneaux (admin)", tonic.Handler(ctrl.ListAllSlots, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste complete des creneaux", []types.AdminSlotResponse{})

	BackofficeSettings.AddRoute("/prestation-pricing", http.MethodGet, "Tarifs prestation", tonic.Handler(ctrl.GetPrestationPricing, http.StatusOK)).
		AddResponse(http.StatusOK, "Tarifs actuels", &settingstypes.PrestationPricing{})

	BackofficeSettings.AddRoute("/prestation-pricing", http.MethodPut, "Modifier les tarifs prestation", tonic.Handler(ctrl.UpdatePrestationPricing, http.StatusOK)).
		AddPayload(&settingstypes.UpdatePrestationPricingRequest{}).
		AddResponse(http.StatusOK, "Tarifs mis à jour", &settingstypes.PrestationPricing{}).
		AddIdempotency()
}
