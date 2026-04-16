package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/modules/payment/types"
)

var (
	PaymentGroup      = RootGroup.NewGroup("/payments", "Paiement Stripe")
	AdminPaymentGroup = RootGroup.NewGroup("/admin/payments", "Admin — Remboursements")
)

func addPaymentRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Payment == nil {
		return
	}
	ctrl := a.Controllers.Payment

	// Client: create intent + check status
	PaymentGroup.AddRoute("/intent", http.MethodPost, "Créer un PaymentIntent Stripe", tonic.Handler(ctrl.CreateIntent, http.StatusOK)).
		AddPayload(&types.CreateIntentRequest{}).
		AddResponse(http.StatusOK, "PaymentIntent créé", &types.IntentResponse{}).
		AddIdempotency()

	PaymentGroup.AddRoute("/orders/:orderId/status", http.MethodGet, "Statut du paiement", tonic.Handler(ctrl.GetIntentStatus, http.StatusOK)).
		AddResponse(http.StatusOK, "Statut", &types.IntentStatusResponse{})

	// Admin: refund
	AdminPaymentGroup.Middlewares = append(AdminPaymentGroup.Middlewares, middleware.RequireRole("admin"))

	AdminPaymentGroup.AddRoute("/refund", http.MethodPost, "Rembourser un paiement", tonic.Handler(ctrl.RefundIntent, http.StatusOK)).
		AddPayload(&types.RefundRequest{}).
		AddResponse(http.StatusOK, "Remboursement", &types.RefundResponse{}).
		AddIdempotency()
}
