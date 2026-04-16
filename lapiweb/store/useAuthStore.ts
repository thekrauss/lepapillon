"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export interface SessionPayload {
  accessToken: string | null;
  refreshToken?: string | null;
  userId: string | null;
  role: "client" | "admin" | null;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  role: "client" | "admin" | null;
  hasHydrated: boolean;
  setSession: (data: SessionPayload) => void;
  setAccessToken: (token: string | null) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  clear: () => void;
}

type AuthSessionState = Pick<
  AuthState,
  "accessToken" | "refreshToken" | "userId" | "role" | "hasHydrated"
>;

const initialState: AuthSessionState = {
  accessToken: null,
  refreshToken: null,
  userId: null,
  role: null,
  hasHydrated: false,
};

export const useAuthStore = create<AuthState>()(
  persist<AuthState>(
    (set) => ({
      ...initialState,
      setSession: (data: SessionPayload) =>
        set({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken ?? null,
          userId: data.userId,
          role: data.role,
        }),
      setAccessToken: (token: string | null) => set({ accessToken: token }),
      setHasHydrated: (hasHydrated: boolean) => set({ hasHydrated }),
      clear: () => set({ ...initialState, hasHydrated: true }),
    }),
    {
      name: "saveursthai-auth-storage",
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
