export interface OrderItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderPrestationResponse {
  booking_id: string;
  price: number;
}

export interface OrderResponse {
  id: string;
  status: "pending" | "paid" | "preparing" | "ready" | "picked_up" | "cancelled";
  items: OrderItemResponse[];
  prestation: OrderPrestationResponse | null;
  items_total: number;
  prestation_total: number;
  total: number;
  pickup_code: string;
  notes: string;
  created_at: string;
}

export interface CreateOrderRequest {
  notes?: string;
  delivery_first_name: string;
  delivery_last_name: string;
  delivery_street: string;
  delivery_city: string;
  delivery_postal_code: string;
  delivery_phone: string;
}

export interface ConfirmPaymentRequest {
  stripe_payment_intent_id: string;
}
