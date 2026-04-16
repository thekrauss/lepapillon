"use client";

import { create } from "zustand";
import type { CartResponse } from "@/types/panierTypes";

interface CartState {
  cart: CartResponse | null;
  isOpen: boolean;
  setCart: (cart: CartResponse) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const emptyCart: CartResponse = {
  items: [],
  prestation: null,
  items_total: 0,
  prestation_total: 0,
  total: 0,
  item_count: 0,
};

export const useCartStore = create<CartState>()((set) => ({
  cart: null,
  isOpen: false,
  setCart: (cart) => set({ cart }),
  clearCart: () => set({ cart: emptyCart }),
  openDrawer: () => set({ isOpen: true }),
  closeDrawer: () => set({ isOpen: false }),
  toggleDrawer: () => set((s) => ({ isOpen: !s.isOpen })),
}));
