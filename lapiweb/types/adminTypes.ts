export interface DashboardResponse {
  total_revenue: number;
  order_count: number;
  prestation_count: number;
  customer_count: number;
  pending_orders: number;
  recent_orders: RecentOrderEntry[];
}

export interface RecentOrderEntry {
  order_id: string;
  user_email: string;
  total: number;
  status: string;
  created_at: string;
}

export interface ClientEntry {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  order_count: number;
  total_spent: number;
  created_at: string;
}

export interface AdminSlotResponse {
  id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  status: "available" | "booked" | "blocked";
  booked_by?: string;
  guest_count?: number;
}

export interface BookingDetailResponse {
  booking_id: string;
  order_id: string;
  user_email: string;
  user_name: string;
  slot_date: string;
  time_slot: string;
  address_street: string;
  address_city: string;
  address_postal_code: string;
  guest_count: number;
  notes: string;
  chef_notes?: string;
  status: string;
  order_items: BookingOrderItem[];
  order_total: number;
  created_at: string;
}

export interface BookingOrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface UpdateOrderStatusRequest {
  status: "pending" | "paid" | "preparing" | "ready" | "picked_up" | "cancelled";
}

export interface UpdatePrestationStatusRequest {
  status: "confirmed" | "completed" | "cancelled";
}

export interface UpdateChefNotesRequest {
  notes: string;
}

export interface CancelPrestationRequest {
  reason?: string;
  refund: boolean;
}

export interface UpdatePrestationPricingRequest {
  base_price?: number;
  price_per_person?: number;
  min_guests?: number;
  max_guests?: number;
}

export interface OrderDetailItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface OrderDetailResponse {
  order_id: string;
  user_email: string;
  user_name: string;
  user_phone: string;
  status: string;
  items: OrderDetailItem[];
  items_total: number;
  prestation_total: number;
  total: number;
  delivery_street: string;
  delivery_city: string;
  delivery_postal: string;
  delivery_phone: string;
  pickup_code: string;
  notes: string;
  created_at: string;
}
