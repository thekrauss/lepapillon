import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as panierDAL from "@/DAL/panier";
import { useAuthStore } from "@/store/useAuthStore";
import type { AddItemRequest, UpdateItemRequest, SetPrestationRequest } from "@/types/panierTypes";

export function useCart() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => panierDAL.getCart().then((r) => r.data),
    enabled: !!accessToken,
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddItemRequest) => panierDAL.addItem(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produit ajouté au panier");
    },
    onError: () => toast.error("Impossible d'ajouter au panier"),
  });
}

export function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateItemRequest) => panierDAL.updateItem(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });
}

export function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => panierDAL.removeItem(productId).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Produit retiré du panier");
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => panierDAL.clearCart(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Panier vidé");
    },
  });
}

export function useSetPrestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SetPrestationRequest) => panierDAL.setPrestation(data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Prestation cheffe ajoutée");
    },
    onError: () => toast.error("Impossible d'ajouter la prestation"),
  });
}

export function useRemovePrestation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => panierDAL.removePrestation().then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Prestation retirée");
    },
  });
}
