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
      console.log('🔍 Checking onboarding status from context...');
      const result = await settingsOperations.getSetting(STORAGE_KEYS.ONBOARDING_COMPLETED);
      
      if (result.success && result.data) {
        const isComplete = result.data === 'true';
        console.log('📋 Onboarding status from DB:', isComplete);
        setIsOnboardingComplete(isComplete);
      } else {
        console.log('📋 No onboarding setting found, defaulting to false');
        setIsOnboardingComplete(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboardingComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const completeOnboarding = useCallback(async () => {
    try {
      console.log('🔄 Setting onboarding completion flag...');
      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'true'
      );
      console.log('📊 Database setSetting result:', result);
      
      if (result.success) {
        console.log('✨ Setting context state isOnboardingComplete to true');
        setIsOnboardingComplete(true);
        setIsLoading(false);
        
        // Force a re-check to ensure consistency
        setTimeout(() => {
          checkOnboardingStatus();
        }, 100);
        
        return true;
      } else {
        console.error('❌ Database setSetting failed:', result.error);
        
        // Fallback: Set the state anyway and let the user continue
        console.log('⚠️ Using fallback: Setting onboarding complete anyway');
        setIsOnboardingComplete(true);
        setIsLoading(false);
        return true;
      }
    } catch (error) {
      console.error('💥 Exception in completeOnboarding:', error);
      
      // Fallback: Set the state anyway and let the user continue
      console.log('⚠️ Using fallback due to exception: Setting onboarding complete anyway');
      setIsOnboardingComplete(true);
      setIsLoading(false);
      return true;
    }
  }, [checkOnboardingStatus]);

  const resetOnboarding = useCallback(async () => {
    try {
      console.log('🔄 resetOnboarding: Starting reset process...');
      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'false'
      );
      console.log('📝 resetOnboarding: Database setSetting result:', result);
      
      if (result.success) {
        console.log('✅ resetOnboarding: Setting isOnboardingComplete to false');
        setIsOnboardingComplete(false);
        // Force re-check to ensure consistency
        await checkOnboardingStatus();
      }
      
      return result.success;
    } catch (error) {
      console.error('💥 Error resetting onboarding:', error);
      return false;
    }
  }, [checkOnboardingStatus]);

  const resetCompleteApp = useCallback(async () => {
    try {
      console.log('🧹 resetCompleteApp: Starting complete app reset...');
      const result = await settingsOperations.resetAllData();
      console.log('📝 resetCompleteApp: Database resetAllData result:', result);
      
      if (result.success) {
        console.log('✅ resetCompleteApp: All data cleared, setting isOnboardingComplete to false');
        setIsOnboardingComplete(false);
        setIsLoading(false);
      }
      
      return result.success;
    } catch (error) {
      console.error('💥 Error resetting complete app:', error);
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