import { create } from "zustand";
import { persist } from "zustand/middleware";

type Prefs = {
  saved: string[];
  textScale: number;
  toggleSaved: (slug: string) => void;
  isSaved: (slug: string) => boolean;
  setTextScale: (scale: number) => void;
};

export const usePrefs = create<Prefs>()(
  persist(
    (set, get) => ({
      saved: [],
      textScale: 1,
      toggleSaved: (slug) =>
        set((s) => ({
          saved: s.saved.includes(slug)
            ? s.saved.filter((x) => x !== slug)
            : [...s.saved, slug],
        })),
      isSaved: (slug) => get().saved.includes(slug),
      setTextScale: (scale) =>
        set({ textScale: Math.min(1.4, Math.max(0.85, Number(scale.toFixed(2))) ) }),
    }),
    { name: "ko-prefs" },
  ),
);
