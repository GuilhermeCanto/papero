import { create } from "zustand";

type DashboardPrivacyState = {
  numbersHidden: boolean;
  toggleNumbersHidden: () => void;
};

export const PRIVATE_VALUE_MASK = "*****";

export const useDashboardPrivacyStore = create<DashboardPrivacyState>((set) => ({
  numbersHidden: false,
  toggleNumbersHidden: () => set((state) => ({ numbersHidden: !state.numbersHidden })),
}));
