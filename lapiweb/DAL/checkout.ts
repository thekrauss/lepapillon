import { authClient } from "@/lib/axios-instance";
import type {
  OrderResponse, CreateOrderRequest, ConfirmPaymentRequest,
} from "@/types/checkoutTypes";

export const createOrder = (data: CreateOrderRequest) =>
  authClient.post<OrderResponse>("/checkout", data);

export const listOrders = () =>
  authClient.get<OrderResponse[]>("/checkout/orders");

export const getOrder = (orderId: string) =>
  authClient.get<OrderResponse>(`/checkout/orders/${orderId}`);

export const confirmPayment = (orderId: string, data: ConfirmPaymentRequest) =>
  authClient.post<OrderResponse>(`/checkout/orders/${orderId}/confirm`, data);
