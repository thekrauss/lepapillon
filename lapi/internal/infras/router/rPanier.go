package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/modules/panier/types"
)

var (
	PanierGroup      = RootGroup.NewGroup("/panier", "Panier d'achat")
	PanierPrestation = PanierGroup.NewGroup("/prestation", "Option prestation cheffe")
)

func addPanierRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Panier == nil {
		return
	}
	ctrl := a.Controllers.Panier

	// ── Cart CRUD ───────────────────────────────────────────────
	PanierGroup.AddRoute("", http.MethodGet, "Voir mon panier", tonic.Handler(ctrl.GetCart, http.StatusOK)).
		AddResponse(http.StatusOK, "Panier courant", &types.CartResponse{})

	PanierGroup.AddRoute("/items", http.MethodPost, "Ajouter un produit au panier", tonic.Handler(ctrl.AddItem, http.StatusOK)).
		AddPayload(&types.AddItemRequest{}).
		AddResponse(http.StatusOK, "Panier mis à jour", &types.CartResponse{}).
		AddIdempotency()

	PanierGroup.AddRoute("/items", http.MethodPut, "Modifier la quantité d'un produit", tonic.Handler(ctrl.UpdateItem, http.StatusOK)).
		AddPayload(&types.UpdateItemRequest{}).
		AddResponse(http.StatusOK, "Panier mis à jour", &types.CartResponse{})

	PanierGroup.AddRoute("/items/:productId", http.MethodDelete, "Retirer un produit du panier", tonic.Handler(ctrl.RemoveItem, http.StatusOK)).
		AddResponse(http.StatusOK, "Panier mis à jour", &types.CartResponse{})

	PanierGroup.AddRoute("", http.MethodDelete, "Vider le panier", tonic.Handler(ctrl.ClearCart, http.StatusNoContent))

	// ── Prestation option ───────────────────────────────────────
	PanierPrestation.AddRoute("", http.MethodPost, "Ajouter une prestation cheffe au panier", tonic.Handler(ctrl.SetPrestation, http.StatusOK)).
		AddPayload(&types.SetPrestationRequest{}).
		AddResponse(http.StatusOK, "Prestation ajoutée", &types.CartResponse{}).
		AddIdempotency()

	PanierPrestation.AddRoute("", http.MethodDelete, "Retirer la prestation du panier", tonic.Handler(ctrl.RemovePrestation, http.StatusOK)).
		AddResponse(http.StatusOK, "Prestation retirée", &types.CartResponse{})
}
