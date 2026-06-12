import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Chama {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  contributionAmount?: number;
  frequency: string;
  role: string;
  memberCount?: number;
}

interface ChamaState {
  currentChama: Chama | null;
  userChamas: Chama[];

  setCurrentChama: (chama: Chama | null) => void;
  setUserChamas: (chamas: Chama[]) => void;

  addChama: (chama: Chama) => void;
  removeChama: (chamaId: string) => void;
  updateChama: (chamaId: string, updates: Partial<Chama>) => void;

  clearChamas: () => void;

  // helpers
  hasChamas: () => boolean;
  getCurrentChamaId: () => string | null;
}

export const useChamaStore = create<ChamaState>()(
  persist(
    (set, get) => ({
      currentChama: null,
      userChamas: [],

      // ========================
      // SET CURRENT CHAMA (SAFE)
      // ========================
      setCurrentChama: (chama) =>
        set((state) => {
          if (!chama) return { currentChama: null };

          const exists = state.userChamas.some((c) => c.id === chama.id);

          return {
            currentChama: exists ? chama : state.userChamas[0] || null,
          };
        }),

      // ========================
      // SET USER CHAMAS + AUTO SELECT
      // ========================
      setUserChamas: (chamas) =>
        set((state) => {
          const current = state.currentChama;

          return {
            userChamas: chamas,
            currentChama:
              current && chamas.find((c) => c.id === current.id)
                ? current
                : chamas[0] || null,
          };
        }),

      // ========================
      // ADD CHAMA
      // ========================
      addChama: (chama) =>
        set((state) => ({
          userChamas: [...state.userChamas, chama],
          currentChama: state.currentChama || chama,
        })),

      // ========================
      // REMOVE CHAMA
      // ========================
      removeChama: (chamaId) =>
        set((state) => {
          const updated = state.userChamas.filter((c) => c.id !== chamaId);

          return {
            userChamas: updated,
            currentChama:
              state.currentChama?.id === chamaId
                ? updated[0] || null
                : state.currentChama,
          };
        }),

      // ========================
      // UPDATE CHAMA
      // ========================
      updateChama: (chamaId, updates) =>
        set((state) => ({
          userChamas: state.userChamas.map((c) =>
            c.id === chamaId ? { ...c, ...updates } : c,
          ),
          currentChama:
            state.currentChama?.id === chamaId
              ? { ...state.currentChama, ...updates }
              : state.currentChama,
        })),

      // ========================
      // CLEAR ALL
      // ========================
      clearChamas: () =>
        set({
          userChamas: [],
          currentChama: null,
        }),

      // ========================
      // HELPERS
      // ========================
      hasChamas: () => get().userChamas.length > 0,

      getCurrentChamaId: () => get().currentChama?.id || null,
    }),
    {
      name: "changa-chama-storage",

      partialize: (state) => ({
        currentChama: state.currentChama,
        userChamas: state.userChamas,
      }),
    },
  ),
);
