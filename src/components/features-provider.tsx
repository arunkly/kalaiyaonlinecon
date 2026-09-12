import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_FEATURES, type FeatureFlags, type FeatureKey } from "@/lib/features";

const FeaturesContext = createContext<FeatureFlags>(DEFAULT_FEATURES);

export function FeaturesProvider({ flags, children }: { flags: FeatureFlags; children: ReactNode }) {
  return <FeaturesContext.Provider value={flags || DEFAULT_FEATURES}>{children}</FeaturesContext.Provider>;
}

export function useFeatures() {
  return useContext(FeaturesContext) || DEFAULT_FEATURES;
}

export function useFeature(key: FeatureKey) {
  return useFeatures()[key] !== false;
}
