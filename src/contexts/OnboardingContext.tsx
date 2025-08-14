import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { settingsOperations } from '../services/database';
import { STORAGE_KEYS } from '../constants';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<boolean>;
  resetOnboarding: () => Promise<boolean>;
  resetCompleteApp: () => Promise<boolean>;
  checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {

      const result = await settingsOperations.getSetting(STORAGE_KEYS.ONBOARDING_COMPLETED);
      
      if (result.success && result.data) {
        const isComplete = result.data === 'true';

        setIsOnboardingComplete(isComplete);
      } else {

        setIsOnboardingComplete(false);
      }
    } catch (error) {
      __DEV__ && console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {

      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'true'
      );

      if (result.success) {

        setIsOnboardingComplete(true);
        setIsLoading(false);
        
        // Force a re-check to ensure consistency
        setTimeout(() => {
          checkOnboardingStatus();
        }, 100);
        
        return true;
      } else {
      __DEV__ && console.error('❌ Database setSetting failed:', result.error);
        
        // Fallback: Set the state anyway and let the user continue

        setIsOnboardingComplete(true);
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      __DEV__ && console.error('💥 Exception in completeOnboarding:', error);
      
      // Fallback: Set the state anyway and let the user continue

      setIsOnboardingComplete(true);
      setIsLoading(false);
      return true;
    }
  }, [checkOnboardingStatus]);

  const resetOnboarding = useCallback(async () => {
    try {

      // Immediately set states to ensure navigation happens
      setIsOnboardingComplete(false);
      setIsLoading(false);

      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'false'
      );

      return result.success;
    } catch (error) {
      __DEV__ && console.error('💥 Error resetting onboarding:', error);
      // Even if DB fails, allow navigation to onboarding
      setIsOnboardingComplete(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  const resetCompleteApp = useCallback(async () => {
    try {

      // First, complete the database reset BEFORE changing navigation

      const result = await settingsOperations.resetAllData();

      // Only after database reset is complete, change navigation states
      if (result.success) {

        setIsOnboardingComplete(false);
        setIsLoading(false);
        return true;
      } else {
      __DEV__ && console.error('❌ resetCompleteApp: Database reset failed, but allowing navigation anyway');
        setIsOnboardingComplete(false);
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      __DEV__ && console.error('💥 Error resetting complete app:', error);
      // Even if DB fails, allow navigation to onboarding
      setIsOnboardingComplete(false);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  const value = useMemo<OnboardingContextType>(() => ({
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    resetCompleteApp,
    checkOnboardingStatus,
  }), [isOnboardingComplete, isLoading, completeOnboarding, resetOnboarding, resetCompleteApp, checkOnboardingStatus]);

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboardingContext = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboardingContext must be used within an OnboardingProvider');
  }
  return context;
};