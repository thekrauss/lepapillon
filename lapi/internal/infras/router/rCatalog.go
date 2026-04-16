package router

import (
	"net/http"

	"github.com/loopfz/gadgeto/tonic"
	"github.com/thekrauss/lepapillon/internal/infras/middleware"
	"github.com/thekrauss/lepapillon/internal/modules/catalogue/types"
)

var (
	CatalogueGroup      = RootGroup.NewGroup("/catalogue", "Catalogue produits & catégories")
	CatalogueProducts   = CatalogueGroup.NewGroup("/products", "Produits")
	CatalogueCategories = CatalogueGroup.NewGroup("/categories", "Catégories")

	AdminCatalogue           = RootGroup.NewGroup("/admin/catalogue", "Admin — Gestion catalogue")
	AdminCatalogueProducts   = AdminCatalogue.NewGroup("/products", "Admin Produits")
	AdminCatalogueCategories = AdminCatalogue.NewGroup("/categories", "Admin Catégories")
)

func addCatalogueRoutes(a *App) {
	if a == nil || a.Controllers == nil || a.Controllers.Catalogue == nil {
		return
	}
	ctrl := a.Controllers.Catalogue

	// ── Public (browsing) ───────────────────────────────────────
	CatalogueCategories.AddRoute("", http.MethodGet, "Lister les catégories", tonic.Handler(ctrl.ListCategories, http.StatusOK)).
		AddResponse(http.StatusOK, "Liste des catégories actives", []types.CategoryResponse{})

	CatalogueCategories.AddRoute("/:slug", http.MethodGet, "Détail catégorie par slug", tonic.Handler(ctrl.GetCategory, http.StatusOK)).
		AddResponse(http.StatusOK, "Catégorie", &types.CategoryResponse{}).
		AddResponse(http.StatusNotFound, "Catégorie introuvable", nil)

	CatalogueProducts.AddRoute("", http.MethodGet, "Lister les produits", tonic.Handler(ctrl.ListProducts, http.StatusOK)).
		AddQuery(&types.ProductListQuery{}).
		AddResponse(http.StatusOK, "Liste des produits", []types.ProductResponse{})

	CatalogueProducts.AddRoute("/:slug", http.MethodGet, "Détail produit par slug", tonic.Handler(ctrl.GetProduct, http.StatusOK)).
		AddResponse(http.StatusOK, "Produit", &types.ProductResponse{}).
		AddResponse(http.StatusNotFound, "Produit introuvable", nil)

	// ── Admin CRUD (requires admin role) ────────────────────────
	AdminCatalogue.Middlewares = append(AdminCatalogue.Middlewares, middleware.RequireRole("admin"))

	AdminCatalogueProducts.AddRoute("", http.MethodPost, "Créer un produit", tonic.Handler(ctrl.CreateProduct, http.StatusCreated)).
		AddPayload(&types.CreateProductRequest{}).
		AddResponse(http.StatusCreated, "Produit créé", &types.ProductResponse{}).
		AddIdempotency()

	AdminCatalogueProducts.AddRoute("/:id", http.MethodPut, "Modifier un produit", tonic.Handler(ctrl.UpdateProduct, http.StatusOK)).
		AddResponse(http.StatusOK, "Produit modifié", &types.ProductResponse{}).
		AddIdempotency()

	AdminCatalogueProducts.AddRoute("/:id", http.MethodDelete, "Supprimer un produit", tonic.Handler(ctrl.DeleteProduct, http.StatusNoContent))

	AdminCatalogueCategories.AddRoute("", http.MethodPost, "Créer une catégorie", tonic.Handler(ctrl.CreateCategory, http.StatusCreated)).
		AddPayload(&types.CreateCategoryRequest{}).
		AddResponse(http.StatusCreated, "Catégorie créée", &types.CategoryResponse{}).
		AddIdempotency()

	AdminCatalogueCategories.AddRoute("/:id", http.MethodPut, "Modifier une catégorie", tonic.Handler(ctrl.UpdateCategory, http.StatusOK)).
		AddResponse(http.StatusOK, "Catégorie modifiée", &types.CategoryResponse{}).
		AddIdempotency()

	AdminCatalogueCategories.AddRoute("/:id", http.MethodDelete, "Supprimer une catégorie", tonic.Handler(ctrl.DeleteCategory, http.StatusNoContent))
}
