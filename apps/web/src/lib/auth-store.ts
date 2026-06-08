import { create } from "zustand";
import { persist } from "zustand/middleware";
import Cookies from "js-cookie";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./api";

export type UserRole =
  | "SUPER_ADMIN"
  | "OWNER"
  | "DOCTOR"
  | "RECEPTIONIST"
  | "PHARMACIST"
  | "CASHIER";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  tenantName?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setSession: (
    user: AuthUser,
    tokens: { accessToken: string; refreshToken: string },
  ) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setSession: (user, tokens) => {
        Cookies.set(ACCESS_TOKEN_KEY, tokens.accessToken, { sameSite: "lax" });
        Cookies.set(REFRESH_TOKEN_KEY, tokens.refreshToken, {
          sameSite: "lax",
        });
        set({ user, isAuthenticated: true });
      },
      clearSession: () => {
        Cookies.remove(ACCESS_TOKEN_KEY);
        Cookies.remove(REFRESH_TOKEN_KEY);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "klinikos-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
