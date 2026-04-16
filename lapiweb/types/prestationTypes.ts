export interface SlotResponse {
  id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
}

export interface BookingResponse {
  id: string;
  user_id: string;
  order_id: string;
  slot: SlotResponse | null;
  address_street: string;
  address_city: string;
  address_postal_code: string;
  guest_count: number;
  notes: string;
  status: "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export interface PrestationPricing {
  base_price: number;
  price_per_person: number;
  min_guests: number;
  max_guests: number;
}

export interface CreateSlotRequest {
  date: string;
  time_slot: string; // HH:MM-HH:MM
}
