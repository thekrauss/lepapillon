import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as adminDAL from "@/DAL/admin";
import type { CreateProductRequest, UpdateProductRequest, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/catalogueTypes";
import type { UpdateOrderStatusRequest, UpdatePrestationStatusRequest, UpdateChefNotesRequest, CancelPrestationRequest } from "@/types/adminTypes";
import type { CreateSlotRequest } from "@/types/prestationTypes";

// ── Dashboard ───────────────────────────────────────────────────────

export function useDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => adminDAL.getDashboard().then((r) => r.data),
  });
}

// ── Products CRUD ───────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) => adminDAL.createProduct(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit créé");
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      adminDAL.updateProduct(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit modifié");
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDAL.deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Produit supprimé");
    },
  });
}

// ── Categories CRUD ─────────────────────────────────────────────────

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => adminDAL.createCategory(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie créée");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      adminDAL.updateCategory(id, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie modifiée");
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminDAL.deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Catégorie supprimée");
    },
  });
}

// ── Orders ──────────────────────────────────────────────────────────

export function useOrders() {
  return useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => adminDAL.listOrders().then((r) => r.data),
  });
}

export function useAdminOrder(orderId: string) {
  return useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => adminDAL.getAdminOrder(orderId).then((r) => r.data),
    enabled: !!orderId,
  });
}

export function useClients() {
  return useQuery({
    queryKey: ["admin-clients"],
    queryFn: () => adminDAL.listClients().then((r) => r.data),
  });
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UpdateOrderStatusRequest }) =>
      adminDAL.updateOrderStatus(orderId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Statut mis à jour");
    },
  });
}

// ── Prestation Slots ────────────────────────────────────────────────

export function usePrestationSlots() {
  return useQuery({
    queryKey: ["prestation-slots"],
    queryFn: () => import("@/DAL/prestation").then((m) => m.listAvailableSlots()).then((r) => r.data),
  });
}

export function useAdminSlots() {
  return useQuery({
    queryKey: ["admin-slots"],
    queryFn: () => adminDAL.listAdminSlots().then((r) => r.data),
  });
}

export function useCreateSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSlotRequest) => adminDAL.createSlot(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prestation-slots"] });
      qc.invalidateQueries({ queryKey: ["admin-slots"] });
      toast.success("Créneau créé");
    },
  });
}

export function useBlockSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => adminDAL.blockSlot(slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prestation-slots"] });
      qc.invalidateQueries({ queryKey: ["admin-slots"] });
      toast.success("Créneau bloqué");
    },
  });
}

export function useUnblockSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => adminDAL.unblockSlot(slotId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["prestation-slots"] });
      qc.invalidateQueries({ queryKey: ["admin-slots"] });
      toast.success("Créneau débloqué");
    },
  });
}

export function useAllBookings() {
  return useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminDAL.listAllBookings().then((r) => r.data),
  });
}

export function useBookingDetails() {
  return useQuery({
    queryKey: ["admin-booking-details"],
    queryFn: () => adminDAL.listBookingDetails().then((r) => r.data),
  });
}

export function useUpdatePrestationStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: UpdatePrestationStatusRequest }) =>
      adminDAL.updatePrestationStatus(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-booking-details"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Statut mis à jour");
    },
  });
}

export function useSendPrestationReminder() {
  return useMutation({
    mutationFn: (bookingId: string) => adminDAL.sendPrestationReminder(bookingId),
    onSuccess: () => toast.success("Rappel envoyé au client"),
    onError: () => toast.error("Erreur lors de l'envoi du rappel"),
  });
}

export function useUpdateChefNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: UpdateChefNotesRequest }) =>
      adminDAL.updatePrestationChefNotes(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-booking-details"] });
      toast.success("Notes sauvegardées");
    },
  });
}

export function useCancelPrestationWithRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, data }: { bookingId: string; data: CancelPrestationRequest }) =>
      adminDAL.cancelPrestationWithRefund(bookingId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-booking-details"] });
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      toast.success("Réservation annulée");
    },
    onError: () => toast.error("Impossible d'annuler cette réservation"),
  });
}

// ── Settings ────────────────────────────────────────────────────────

export function useAdminPrestationPricing() {
  return useQuery({
    queryKey: ["admin-prestation-pricing"],
    queryFn: () => adminDAL.getPrestationPricing().then((r) => r.data),
  });
}

export function useUpdatePrestationPricing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<import("@/types/prestationTypes").PrestationPricing>) =>
      adminDAL.updatePrestationPricing(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-prestation-pricing"] });
      qc.invalidateQueries({ queryKey: ["prestation-pricing"] });
      toast.success("Tarifs mis à jour");
    },
  });
}
