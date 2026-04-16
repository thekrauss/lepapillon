package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/modules/prestation/types"
	settingstypes "github.com/thekrauss/lepapillon/internal/modules/settings/types"
)

var (
	PrestationGroup      = RootGroup.NewGroup("/prestations", "Prestation cheffe à domicile")
	PrestationSlots      = PrestationGroup.NewGroup("/slots", "Créneaux disponibles")
	PrestationPricing    = PrestationGroup.NewGroup("/pricing", "Tarifs prestation")
	PrestationBookings   = PrestationGroup.NewGroup("/bookings", "Réservations client")
	AdminPrestationGroup = RootGroup.NewGroup("/admin/prestations", "Admin — Gestion prestations")
	AdminPrestationSlots = AdminPrestationGroup.NewGroup("/slots", "Admin créneaux")
)

func addPrestationRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Prestation == nil {
		return
	}
	ctrl := a.Controllers.Prestation

	//  Public
	PrestationSlots.AddRoute("", http.MethodGet, "Créneaux disponibles", tonic.Handler(ctrl.ListAvailableSlots, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des créneaux", []types.SlotResponse{})

	//  Public pricing (for "à partir de X €" on frontend)
	PrestationPricing.AddRoute("", http.MethodGet, "Tarifs prestation", prestationPricingHandler(a))

	//  Client (authenticated)
	PrestationBookings.AddRoute("", http.MethodGet, "Mes réservations", tonic.Handler(ctrl.ListUserBookings, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des réservations", []types.BookingResponse{})

	PrestationBookings.AddRoute("/:bookingId", http.MethodGet, "Détail réservation", tonic.Handler(ctrl.GetBooking, http.StatusOK)).
		AddResponse(http.StatusOK, "Réservation", &types.BookingResponse{})

	//  Admin
	AdminPrestationGroup.Middlewares = append(AdminPrestationGroup.Middlewares, middleware.RequireRole("admin"))

	AdminPrestationSlots.AddRoute("", http.MethodPost, "Créer un créneau", tonic.Handler(ctrl.CreateSlot, http.StatusCreated)).
		AddPayload(&types.CreateSlotRequest{}).
		AddResponse(http.StatusCreated, "Créneau créé", &types.SlotResponse{}).
		AddIdempotency()

	AdminPrestationSlots.AddRoute("/:slotId/block", http.MethodPost, "Bloquer un créneau", tonic.Handler(ctrl.BlockSlot, http.StatusNoContent))
	AdminPrestationSlots.AddRoute("/:slotId/unblock", http.MethodPost, "Débloquer un créneau", tonic.Handler(ctrl.UnblockSlot, http.StatusNoContent))

	AdminPrestationGroup.AddRoute("/bookings", http.MethodGet, "Toutes les réservations", tonic.Handler(ctrl.ListAllBookings, http.StatusOK)).
		AddResponse(http.StatusOK, "Planning prestations", []types.BookingResponse{})
}

// prestationPricingHandler returns the current prestation pricing for the frontend.
// Public endpoint — no auth required.
func prestationPricingHandler(a *App) gin.HandlerFunc {
	return func(c *gin.Context) {
		if a.Services == nil || a.Services.Settings == nil {
			c.JSON(http.StatusOK, settingstypes.PrestationPricing{
				BasePrice: 5000, PricePerPerson: 1500, MinGuests: 2, MaxGuests: 12,
			})
			return
		}
		pricing, err := a.Services.Settings.GetPrestationPricing(c.Request.Context())
		if err != nil {
			c.JSON(http.StatusOK, settingstypes.PrestationPricing{
				BasePrice: 5000, PricePerPerson: 1500, MinGuests: 2, MaxGuests: 12,
			})
			return
		}
		c.JSON(http.StatusOK, pricing)
	}
}
