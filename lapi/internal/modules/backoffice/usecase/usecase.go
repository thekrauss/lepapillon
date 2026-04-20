package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"github.com/thekrauss/lepapillon/internal/infras/worker"
	"github.com/thekrauss/lepapillon/internal/modules/backoffice/types"
	checkoutrepo "github.com/thekrauss/lepapillon/internal/modules/checkout/repository"
	prestationrepo "github.com/thekrauss/lepapillon/internal/modules/prestation/repository"
	settingssvc "github.com/thekrauss/lepapillon/internal/modules/settings"
	settingstypes "github.com/thekrauss/lepapillon/internal/modules/settings/types"
	"gorm.io/gorm"
)

type IBackofficeUseCase interface {
	GetDashboard(ctx context.Context) (*types.DashboardResponse, error)
	ListOrders(ctx context.Context) ([]types.RecentOrderEntry, error)
	GetOrderDetail(ctx context.Context, orderID uuid.UUID) (*types.OrderDetailResponse, error)
	ListClients(ctx context.Context) ([]types.ClientEntry, error)
	ListBookingDetails(ctx context.Context) ([]types.BookingDetailResponse, error)
	ListAllSlots(ctx context.Context) ([]types.AdminSlotResponse, error)
	UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string) error
	GetPrestationPricing(ctx context.Context) (*settingstypes.PrestationPricing, error)
	UpdatePrestationPricing(ctx context.Context, req *settingstypes.UpdatePrestationPricingRequest) (*settingstypes.PrestationPricing, error)
}

type backofficeUseCase struct {
	db          *gorm.DB
	orderRepo   checkoutrepo.CheckoutRepository
	prestRepo   prestationrepo.PrestationRepository
	settingsSvc settingssvc.Service
	distributor worker.TaskDistributor
}

func NewBackofficeUseCase(
	db *gorm.DB,
	orderRepo checkoutrepo.CheckoutRepository,
	prestRepo prestationrepo.PrestationRepository,
	settingsSvc settingssvc.Service,
	distributor worker.TaskDistributor,
) IBackofficeUseCase {
	return &backofficeUseCase{db: db, orderRepo: orderRepo, prestRepo: prestRepo, settingsSvc: settingsSvc, distributor: distributor}
}

func (uc *backofficeUseCase) GetDashboard(ctx context.Context) (*types.DashboardResponse, error) {
	var resp types.DashboardResponse

	uc.db.WithContext(ctx).Raw(`
		SELECT COALESCE(SUM(total), 0) AS total_revenue, COUNT(*) AS order_count
		FROM orders WHERE deleted_at IS NULL AND status != 'cancelled'
	`).Scan(&resp)

	uc.db.WithContext(ctx).Raw(`SELECT COUNT(*) FROM orders WHERE status = 'pending' AND deleted_at IS NULL`).Scan(&resp.PendingOrders)
	uc.db.WithContext(ctx).Raw(`SELECT COUNT(*) FROM prestation_bookings WHERE status = 'confirmed'`).Scan(&resp.PrestationCount)
	uc.db.WithContext(ctx).Raw(`SELECT COUNT(DISTINCT user_id) FROM orders WHERE deleted_at IS NULL`).Scan(&resp.CustomerCount)

	var recent []types.RecentOrderEntry
	uc.db.WithContext(ctx).Raw(`
		SELECT o.id AS order_id, u.email AS user_email, o.total, o.status, o.created_at
		FROM orders o LEFT JOIN users u ON o.user_id = u.id
		WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC LIMIT 10
	`).Scan(&recent)
	resp.RecentOrders = recent

	return &resp, nil
}

func (uc *backofficeUseCase) ListOrders(ctx context.Context) ([]types.RecentOrderEntry, error) {
	var orders []types.RecentOrderEntry
	err := uc.db.WithContext(ctx).Raw(`
		SELECT o.id AS order_id, u.email AS user_email, o.total, o.status, o.created_at
		FROM orders o LEFT JOIN users u ON o.user_id = u.id
		WHERE o.deleted_at IS NULL ORDER BY o.created_at DESC LIMIT 100
	`).Scan(&orders).Error
	return orders, err
}

func (uc *backofficeUseCase) GetOrderDetail(ctx context.Context, orderID uuid.UUID) (*types.OrderDetailResponse, error) {
	type orderRow struct {
		OrderID        uuid.UUID `gorm:"column:order_id"`
		UserEmail      string    `gorm:"column:user_email"`
		UserFirstName  string    `gorm:"column:user_first_name"`
		UserLastName   string    `gorm:"column:user_last_name"`
		UserPhone      string    `gorm:"column:user_phone"`
		Status         string    `gorm:"column:status"`
		ItemsTotal     int64     `gorm:"column:items_total"`
		PrestationTotal int64    `gorm:"column:prestation_total"`
		Total          int64     `gorm:"column:total"`
		DeliveryStreet  string   `gorm:"column:delivery_street"`
		DeliveryCity    string   `gorm:"column:delivery_city"`
		DeliveryPostal  string   `gorm:"column:delivery_postal_code"`
		DeliveryPhone   string   `gorm:"column:delivery_phone"`
		PickupCode      string   `gorm:"column:pickup_code"`
		Notes           string   `gorm:"column:notes"`
		CreatedAt       time.Time `gorm:"column:created_at"`
	}
	var row orderRow
	err := uc.db.WithContext(ctx).Raw(`
		SELECT o.id AS order_id, u.email AS user_email, u.first_name AS user_first_name,
		       u.last_name AS user_last_name, u.phone AS user_phone,
		       o.status, o.items_total, o.prestation_total, o.total,
		       o.delivery_street, o.delivery_city, o.delivery_postal_code,
		       o.delivery_phone, o.pickup_code, o.notes, o.created_at
		FROM orders o LEFT JOIN users u ON o.user_id = u.id
		WHERE o.id = ? AND o.deleted_at IS NULL
	`, orderID).Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.OrderID == uuid.Nil {
		return nil, fmt.Errorf("order not found")
	}

	type itemRow struct {
		ProductName string `gorm:"column:product_name"`
		Quantity    int    `gorm:"column:quantity"`
		Price       int64  `gorm:"column:price"`
	}
	var items []itemRow
	uc.db.WithContext(ctx).Raw(`
		SELECT product_name, quantity, price FROM order_items WHERE order_id = ?
	`, orderID).Scan(&items)

	detailItems := make([]types.OrderDetailItem, 0, len(items))
	for _, it := range items {
		detailItems = append(detailItems, types.OrderDetailItem{
			ProductName: it.ProductName,
			Quantity:    it.Quantity,
			Price:       it.Price,
		})
	}

	userName := row.UserFirstName
	if row.UserLastName != "" {
		userName += " " + row.UserLastName
	}
	if userName == "" {
		userName = row.UserEmail
	}

	return &types.OrderDetailResponse{
		OrderID:         row.OrderID,
		UserEmail:       row.UserEmail,
		UserName:        userName,
		UserPhone:       row.UserPhone,
		Status:          row.Status,
		Items:           detailItems,
		ItemsTotal:      row.ItemsTotal,
		PrestationTotal: row.PrestationTotal,
		Total:           row.Total,
		DeliveryStreet:  row.DeliveryStreet,
		DeliveryCity:    row.DeliveryCity,
		DeliveryPostal:  row.DeliveryPostal,
		DeliveryPhone:   row.DeliveryPhone,
		PickupCode:      row.PickupCode,
		Notes:           row.Notes,
		CreatedAt:       row.CreatedAt,
	}, nil
}

func (uc *backofficeUseCase) ListClients(ctx context.Context) ([]types.ClientEntry, error) {
	var clients []types.ClientEntry
	err := uc.db.WithContext(ctx).Raw(`
		SELECT u.id AS user_id, u.email, u.first_name, u.last_name, u.phone,
			   COUNT(o.id) AS order_count,
			   COALESCE(SUM(o.total), 0) AS total_spent,
			   u.created_at
		FROM users u
		LEFT JOIN orders o ON o.user_id = u.id AND o.deleted_at IS NULL AND o.status != 'cancelled'
		WHERE u.deleted_at IS NULL AND u.role = 'client'
		GROUP BY u.id
		ORDER BY u.created_at DESC
		LIMIT 100
	`).Scan(&clients).Error
	return clients, err
}

func (uc *backofficeUseCase) ListAllSlots(ctx context.Context) ([]types.AdminSlotResponse, error) {
	type slotRow struct {
		ID          uuid.UUID `gorm:"column:id"`
		Date        time.Time `gorm:"column:date"`
		TimeSlot    string    `gorm:"column:time_slot"`
		IsAvailable bool      `gorm:"column:is_available"`
		BookedBy    *string   `gorm:"column:booked_by"`
		GuestCount  *int      `gorm:"column:guest_count"`
	}
	var rows []slotRow
	uc.db.WithContext(ctx).Raw(`
		SELECT ps.id, ps.date, ps.time_slot, ps.is_available,
			   u.email AS booked_by,
			   pb.guest_count
		FROM prestation_slots ps
		LEFT JOIN prestation_bookings pb ON pb.slot_id = ps.id AND pb.status = 'confirmed'
		LEFT JOIN users u ON pb.user_id = u.id
		ORDER BY ps.date ASC, ps.time_slot ASC
	`).Scan(&rows)

	result := make([]types.AdminSlotResponse, 0, len(rows))
	for _, r := range rows {
		status := "available"
		if r.BookedBy != nil && *r.BookedBy != "" {
			status = "booked"
		} else if !r.IsAvailable {
			status = "blocked"
		}
		entry := types.AdminSlotResponse{
			ID:          r.ID,
			Date:        r.Date,
			TimeSlot:    r.TimeSlot,
			IsAvailable: r.IsAvailable,
			Status:      status,
		}
		if r.BookedBy != nil {
			entry.BookedBy = *r.BookedBy
		}
		if r.GuestCount != nil {
			entry.GuestCount = *r.GuestCount
		}
		result = append(result, entry)
	}
	return result, nil
}

func (uc *backofficeUseCase) ListBookingDetails(ctx context.Context) ([]types.BookingDetailResponse, error) {
	// Get bookings with slot, user and order items in one go
	type bookingRow struct {
		BookingID         uuid.UUID `gorm:"column:booking_id"`
		OrderID           uuid.UUID `gorm:"column:order_id"`
		UserEmail         string    `gorm:"column:user_email"`
		UserFirstName     string    `gorm:"column:user_first_name"`
		UserLastName      string    `gorm:"column:user_last_name"`
		SlotDate          string    `gorm:"column:slot_date"`
		TimeSlot          string    `gorm:"column:time_slot"`
		AddressStreet     string    `gorm:"column:address_street"`
		AddressCity       string    `gorm:"column:address_city"`
		AddressPostalCode string    `gorm:"column:address_postal_code"`
		GuestCount        int       `gorm:"column:guest_count"`
		Notes             string    `gorm:"column:notes"`
		ChefNotes         string    `gorm:"column:chef_notes"`
		Status            string    `gorm:"column:status"`
		OrderTotal        int64     `gorm:"column:order_total"`
		CreatedAt         string    `gorm:"column:created_at"`
	}

	var rows []bookingRow
	uc.db.WithContext(ctx).Raw(`
		SELECT pb.id AS booking_id, pb.order_id,
			   u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
			   ps.date AS slot_date, ps.time_slot,
			   pb.address_street, pb.address_city, pb.address_postal_code,
			   pb.guest_count, pb.notes, pb.chef_notes, pb.status,
			   COALESCE(o.total, 0) AS order_total,
			   pb.created_at
		FROM prestation_bookings pb
		LEFT JOIN users u ON pb.user_id = u.id
		LEFT JOIN prestation_slots ps ON pb.slot_id = ps.id
		LEFT JOIN orders o ON pb.order_id = o.id
		ORDER BY ps.date ASC, ps.time_slot ASC
	`).Scan(&rows)

	// Get order items per order
	type itemRow struct {
		OrderID     uuid.UUID `gorm:"column:order_id"`
		ProductName string    `gorm:"column:product_name"`
		Quantity    int       `gorm:"column:quantity"`
		Price       int64     `gorm:"column:price"`
	}

	orderIDs := make([]uuid.UUID, 0, len(rows))
	for _, r := range rows {
		if r.OrderID != uuid.Nil {
			orderIDs = append(orderIDs, r.OrderID)
		}
	}

	itemsByOrder := make(map[uuid.UUID][]types.BookingOrderItem)
	if len(orderIDs) > 0 {
		var items []itemRow
		uc.db.WithContext(ctx).Raw(`
			SELECT order_id, product_name, quantity, price
			FROM order_items WHERE order_id IN ?
		`, orderIDs).Scan(&items)
		for _, it := range items {
			itemsByOrder[it.OrderID] = append(itemsByOrder[it.OrderID], types.BookingOrderItem{
				ProductName: it.ProductName,
				Quantity:    it.Quantity,
				Price:       it.Price,
			})
		}
	}

	result := make([]types.BookingDetailResponse, 0, len(rows))
	for _, r := range rows {
		var slotDate, createdAt time.Time
		slotDate, _ = time.Parse(time.RFC3339, r.SlotDate)
		if slotDate.IsZero() {
			slotDate, _ = time.Parse("2006-01-02T15:04:05Z", r.SlotDate)
		}
		createdAt, _ = time.Parse(time.RFC3339, r.CreatedAt)
		if createdAt.IsZero() {
			createdAt, _ = time.Parse("2006-01-02T15:04:05.999999-07:00", r.CreatedAt)
		}

		userName := r.UserFirstName
		if r.UserLastName != "" {
			userName += " " + r.UserLastName
		}
		if userName == "" {
			userName = r.UserEmail
		}

		result = append(result, types.BookingDetailResponse{
			BookingID:         r.BookingID,
			OrderID:           r.OrderID,
			UserEmail:         r.UserEmail,
			UserName:          userName,
			SlotDate:          slotDate,
			TimeSlot:          r.TimeSlot,
			AddressStreet:     r.AddressStreet,
			AddressCity:       r.AddressCity,
			AddressPostalCode: r.AddressPostalCode,
			GuestCount:        r.GuestCount,
			Notes:             r.Notes,
			ChefNotes:         r.ChefNotes,
			Status:            r.Status,
			OrderItems:        itemsByOrder[r.OrderID],
			OrderTotal:        r.OrderTotal,
			CreatedAt:         createdAt,
		})
	}
	return result, nil
}

func (uc *backofficeUseCase) UpdateOrderStatus(ctx context.Context, orderID uuid.UUID, status string) error {
	if err := uc.orderRepo.UpdateOrderStatus(ctx, orderID, status); err != nil {
		return err
	}

	// Send "order ready" email when status becomes "ready"
	if status == "ready" {
		go uc.sendOrderReadyEmail(ctx, orderID)
	}
	return nil
}

func (uc *backofficeUseCase) sendOrderReadyEmail(ctx context.Context, orderID uuid.UUID) {
	if uc.distributor == nil {
		return
	}
	type orderRow struct {
		UserEmail  string `gorm:"column:user_email"`
		PickupCode string `gorm:"column:pickup_code"`
	}
	var row orderRow
	uc.db.WithContext(ctx).Raw(`
		SELECT u.email AS user_email, o.pickup_code
		FROM orders o LEFT JOIN users u ON o.user_id = u.id
		WHERE o.id = ?
	`, orderID).Scan(&row)

	if row.UserEmail == "" {
		return
	}

	if err := uc.distributor.DistributeMailTask(ctx,
		[]string{row.UserEmail},
		"Votre commande est prete !",
		"order_ready.html",
		map[string]string{
			"order_id":    orderID.String()[:8],
			"pickup_code": row.PickupCode,
		},
	); err != nil {
		logrus.WithError(err).Warn("failed to enqueue order ready email")
	}
}

func (uc *backofficeUseCase) GetPrestationPricing(ctx context.Context) (*settingstypes.PrestationPricing, error) {
	return uc.settingsSvc.GetPrestationPricing(ctx)
}

func (uc *backofficeUseCase) UpdatePrestationPricing(ctx context.Context, req *settingstypes.UpdatePrestationPricingRequest) (*settingstypes.PrestationPricing, error) {
	return uc.settingsSvc.UpdatePrestationPricing(ctx, req)
}
