package panier

import (
	"errors"

	"github.com/gin-gonic/gin"
	"github.com/thekrauss/lepapillon/internal/modules/panier/types"
	"github.com/thekrauss/lepapillon/internal/modules/panier/usecase"
)

// IPanierController — tonic-style signatures.
type IPanierController interface {
	GetCart(c *gin.Context, in *types.NoBody) (*types.CartResponse, error)
	AddItem(c *gin.Context, in *types.AddItemRequest) (*types.CartResponse, error)
	UpdateItem(c *gin.Context, in *types.UpdateItemRequest) (*types.CartResponse, error)
	RemoveItem(c *gin.Context, in *types.RemoveItemInput) (*types.CartResponse, error)
	SetPrestation(c *gin.Context, in *types.SetPrestationRequest) (*types.CartResponse, error)
	RemovePrestation(c *gin.Context, in *types.NoBody) (*types.CartResponse, error)
	ClearCart(c *gin.Context, in *types.NoBody) error
}

type PanierController struct {
	uc usecase.IPanierUseCase
}

func NewPanierController(uc usecase.IPanierUseCase) IPanierController {
	return &PanierController{uc: uc}
}

func (ctrl *PanierController) GetCart(c *gin.Context, _ *types.NoBody) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.GetCart(c.Request.Context(), userID)
}

func (ctrl *PanierController) AddItem(c *gin.Context, in *types.AddItemRequest) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.AddItem(c.Request.Context(), userID, in)
}

func (ctrl *PanierController) UpdateItem(c *gin.Context, in *types.UpdateItemRequest) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.UpdateItem(c.Request.Context(), userID, in)
}

func (ctrl *PanierController) RemoveItem(c *gin.Context, in *types.RemoveItemInput) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.RemoveItem(c.Request.Context(), userID, in.ProductID)
}

func (ctrl *PanierController) SetPrestation(c *gin.Context, in *types.SetPrestationRequest) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.SetPrestation(c.Request.Context(), userID, in)
}

func (ctrl *PanierController) RemovePrestation(c *gin.Context, _ *types.NoBody) (*types.CartResponse, error) {
	userID, err := extractUserID(c)
	if err != nil {
		return nil, err
	}
	return ctrl.uc.RemovePrestation(c.Request.Context(), userID)
}

func (ctrl *PanierController) ClearCart(c *gin.Context, _ *types.NoBody) error {
	userID, err := extractUserID(c)
	if err != nil {
		return err
	}
	return ctrl.uc.ClearCart(c.Request.Context(), userID)
}

func extractUserID(c *gin.Context) (string, error) {
	raw, exists := c.Get("user_id")
	if !exists {
		return "", errors.New("user context missing")
	}
	userID, ok := raw.(string)
	if !ok || userID == "" {
		return "", errors.New("invalid user context")
	}
	return userID, nil
}
