import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as checkoutDAL from "@/DAL/checkout";
import { useAuthStore } from "@/store/useAuthStore";
import type { CreateOrderRequest, ConfirmPaymentRequest } from "@/types/checkoutTypes";

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderRequest) => checkoutDAL.createOrder(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Commande créée !");
    },
    onError: () => toast.error("Erreur lors de la commande"),
  });
}

export function useOrders() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => checkoutDAL.listOrders().then((r) => r.data),
    enabled: !!accessToken,
  });
}

export function useOrder(orderId: string) {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => checkoutDAL.getOrder(orderId).then((r) => r.data),
    enabled: !!accessToken && !!orderId,
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: ConfirmPaymentRequest }) =>
      checkoutDAL.confirmPayment(orderId, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Paiement confirmé !");
    },
  });
}
