import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingOut: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      isLoggingOut: false,
      setUser: (user) => set({ user }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setLoading: (value) => set({ isLoading: value }),
      logout: async () => {
        // Immediately set logout state and hide loading
        set({ 
          isLoggingOut: true,
          isLoading: false,
          user: null,
          isAuthenticated: false 
        });
        
        // Call logout endpoint to clear httpOnly cookie
        try {
          await fetch("http://localhost:5000/changa/auth/logout", {
            method: "POST",
            credentials: "include",
          });
        } catch (error) {
          console.error("Logout error:", error);
        }

        // Clear local storage
        localStorage.removeItem("changa-auth-storage");
        localStorage.removeItem("changa-chama-storage");
        
        // Reset logout state
        set({ isLoggingOut: false });
        
        // Force navigation to login page
        window.location.href = "/";
      },
    }),
    {
      name: "changa-auth-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isLoading = false;
          state.isLoggingOut = false;
        }
      },
    },
  ),
);