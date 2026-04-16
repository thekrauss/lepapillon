import { authClient } from "@/lib/axios-instance";
import type {
  CartResponse, AddItemRequest, UpdateItemRequest, SetPrestationRequest,
} from "@/types/panierTypes";

export const getCart = () =>
  authClient.get<CartResponse>("/panier");

export const addItem = (data: AddItemRequest) =>
  authClient.post<CartResponse>("/panier/items", data);

export const updateItem = (data: UpdateItemRequest) =>
  authClient.put<CartResponse>("/panier/items", data);

export const removeItem = (productId: string) =>
  authClient.delete<CartResponse>(`/panier/items/${productId}`);

export const clearCart = () =>
  authClient.delete("/panier");

export const setPrestation = (data: SetPrestationRequest) =>
  authClient.post<CartResponse>("/panier/prestation", data);

export const removePrestation = () =>
  authClient.delete<CartResponse>("/panier/prestation");
