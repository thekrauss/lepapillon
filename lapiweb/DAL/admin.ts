import { authClient } from "@/lib/axios-instance";
import type { DashboardResponse, UpdateOrderStatusRequest } from "@/types/adminTypes";
import type {
  CreateProductRequest, UpdateProductRequest, ProductResponse,
  CreateCategoryRequest, UpdateCategoryRequest, CategoryResponse,
} from "@/types/catalogueTypes";
import type { OrderResponse } from "@/types/checkoutTypes";
import type { PrestationPricing, BookingResponse, CreateSlotRequest, SlotResponse } from "@/types/prestationTypes";

// ── Dashboard ───────────────────────────────────────────────────────

export const getDashboard = () =>
  authClient.get<DashboardResponse>("/admin/dashboard");

// ── Products CRUD ───────────────────────────────────────────────────

export const createProduct = (data: CreateProductRequest) =>
  authClient.post<ProductResponse>("/admin/catalogue/products", data);

export const updateProduct = (id: string, data: UpdateProductRequest) =>
  authClient.put<ProductResponse>(`/admin/catalogue/products/${id}`, data);

export const deleteProduct = (id: string) =>
  authClient.delete(`/admin/catalogue/products/${id}`);

// ── Categories CRUD ─────────────────────────────────────────────────

export const createCategory = (data: CreateCategoryRequest) =>
  authClient.post<CategoryResponse>("/admin/catalogue/categories", data);

export const updateCategory = (id: string, data: UpdateCategoryRequest) =>
  authClient.put<CategoryResponse>(`/admin/catalogue/categories/${id}`, data);

export const deleteCategory = (id: string) =>
  authClient.delete(`/admin/catalogue/categories/${id}`);

// ── Orders ──────────────────────────────────────────────────────────

export const listOrders = () =>
  authClient.get<import("@/types/adminTypes").RecentOrderEntry[]>("/admin/orders");

export const updateOrderStatus = (orderId: string, data: UpdateOrderStatusRequest) =>
  authClient.put(`/admin/orders/${orderId}/status`, data);

export const listClients = () =>
  authClient.get<import("@/types/adminTypes").ClientEntry[]>("/admin/clients");

// ── Prestation Slots ────────────────────────────────────────────────

export const createSlot = (data: CreateSlotRequest) =>
  authClient.post<SlotResponse>("/admin/prestations/slots", data);

export const blockSlot = (slotId: string) =>
  authClient.post(`/admin/prestations/slots/${slotId}/block`);

export const unblockSlot = (slotId: string) =>
  authClient.post(`/admin/prestations/slots/${slotId}/unblock`);

export const listAllBookings = () =>
  authClient.get<BookingResponse[]>("/admin/prestations/bookings");

export const listBookingDetails = () =>
  authClient.get<import("@/types/adminTypes").BookingDetailResponse[]>("/admin/bookings");

export const listAdminSlots = () =>
  authClient.get<import("@/types/adminTypes").AdminSlotResponse[]>("/admin/slots");

// ── Settings ────────────────────────────────────────────────────────

export const getPrestationPricing = () =>
  authClient.get<PrestationPricing>("/admin/settings/prestation-pricing");

export const updatePrestationPricing = (data: Partial<PrestationPricing>) =>
  authClient.put<PrestationPricing>("/admin/settings/prestation-pricing", data);
