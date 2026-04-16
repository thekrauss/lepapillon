package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
)

var (
	AuthGroup = RootGroup.NewGroup("/auth", "Profil utilisateur & adresses")
)

// addAuthRoutes registers authenticated user routes (profile, addresses).
// Login/register/social lives in identity routes.
func addAuthRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Auth == nil {
		return
	}
	ctrl := a.Controllers.Auth

	// Profile
	AuthGroup.AddRoute("/profile", http.MethodGet, "Mon profil", tonic.Handler(ctrl.GetProfile, http.StatusOK))
	AuthGroup.AddRoute("/profile", http.MethodPut, "Modifier mon profil", tonic.Handler(ctrl.UpdateProfile, http.StatusOK)).AddIdempotency()

	// Addresses
	AuthGroup.AddRoute("/addresses", http.MethodGet, "Mes adresses", tonic.Handler(ctrl.ListAddresses, http.StatusOK))
	AuthGroup.AddRoute("/addresses", http.MethodPost, "Ajouter une adresse", tonic.Handler(ctrl.CreateAddress, http.StatusCreated)).AddIdempotency()
	AuthGroup.AddRoute("/addresses/:id", http.MethodPut, "Modifier une adresse", tonic.Handler(ctrl.UpdateAddress, http.StatusOK)).AddIdempotency()
	AuthGroup.AddRoute("/addresses/:id", http.MethodDelete, "Supprimer une adresse", tonic.Handler(ctrl.DeleteAddress, http.StatusNoContent))
}
