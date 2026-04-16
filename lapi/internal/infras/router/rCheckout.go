package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/modules/checkout/types"
)

var (
	CheckoutGroup = RootGroup.NewGroup("/checkout", "Commandes & paiement")
)

func addCheckoutRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Checkout == nil {
		return
	}
	ctrl := a.Controllers.Checkout

	CheckoutGroup.AddRoute("", http.MethodPost, "Créer une commande depuis le panier", tonic.Handler(ctrl.CreateOrder, http.StatusCreated)).
		AddPayload(&types.CreateOrderRequest{}).
		AddResponse(http.StatusCreated, "Commande créée", &types.OrderResponse{}).
		AddIdempotency()

	CheckoutGroup.AddRoute("/orders", http.MethodGet, "Mes commandes", tonic.Handler(ctrl.ListOrders, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des commandes", []types.OrderResponse{})

	CheckoutGroup.AddRoute("/orders/:orderId", http.MethodGet, "Détail d'une commande", tonic.Handler(ctrl.GetOrder, http.StatusOK)).
		AddResponse(http.StatusOK, "Commande", &types.OrderResponse{})

	CheckoutGroup.AddRoute("/orders/:orderId/confirm", http.MethodPost, "Confirmer le paiement", tonic.Handler(ctrl.ConfirmPayment, http.StatusOK)).
		AddPayload(&types.ConfirmPaymentRequest{}).
		AddResponse(http.StatusOK, "Paiement confirmé", &types.OrderResponse{}).
		AddIdempotency()
}
