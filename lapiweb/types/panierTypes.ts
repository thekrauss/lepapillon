export interface CartItemResponse {
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string;
  subtotal: number;
}

export interface PrestationOptResponse {
  date: string;
  time_slot: string;
  street: string;
  city: string;
  postal_code: string;
  guest_count: number;
  notes: string;
  price: number;
}

export interface CartResponse {
  items: CartItemResponse[];
  prestation: PrestationOptResponse | null;
  items_total: number;
  prestation_total: number;
  total: number;
  item_count: number;
}

export interface AddItemRequest {
  product_id: string;
  quantity: number;
}

export interface UpdateItemRequest {
  product_id: string;
  quantity: number;
}

export interface SetPrestationRequest {
  date: string;
  time_slot: string;
  street: string;
  city: string;
  postal_code: string;
  guest_count: number;
  notes?: string;
}
