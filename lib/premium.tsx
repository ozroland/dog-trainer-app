import React, { createContext, useContext } from 'react';

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  purchasePremium: () => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  resetPremium: () => Promise<void>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

export const PREMIUM_STORAGE_KEY = 'dogtrainer_is_premium';

/**
 * V1 Premium Strategy: Everyone is premium for free!
 * 
 * This eliminates the race condition where useState(true) conflicted with
 * checkPremiumStatus() reading from AsyncStorage.
 * 
 * 
 * // Note: RevenueCat integration planned for future release
 */
export function PremiumProvider({ children }: { children: React.ReactNode }) {
  // V1: Everyone is premium - no loading, no async checks, no race conditions
  const isPremium = true;
  const isLoading = false;

  // No-op functions that maintain the interface for future RevenueCat integration
  const purchasePremium = async (): Promise<boolean> => {
    // V1: Already premium, always succeed
    return true;
  };

  const restorePurchases = async (): Promise<boolean> => {
    // V1: Already premium, always succeed
    return true;
  };

  const resetPremium = async (): Promise<void> => {
    // V1: No-op, everyone stays premium
    // V1: No-op, everyone stays premium
  };

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, purchasePremium, restorePurchases, resetPremium }}>
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (context === undefined) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
}
