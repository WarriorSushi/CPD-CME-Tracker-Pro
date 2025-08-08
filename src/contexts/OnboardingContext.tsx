import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { settingsOperations } from '../services/database';
import { STORAGE_KEYS } from '../constants';

interface OnboardingContextType {
  isOnboardingComplete: boolean;
  isLoading: boolean;
  completeOnboarding: () => Promise<boolean>;
  resetOnboarding: () => Promise<boolean>;
  checkOnboardingStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({ children }) => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
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
  };

  const completeOnboarding = async () => {
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
      } else {
        console.error('❌ Database setSetting failed:', result.error);
      }
      
      return result.success;
    } catch (error) {
      console.error('💥 Exception in completeOnboarding:', error);
      return false;
    }
  };

  const resetOnboarding = async () => {
    try {
      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'false'
      );
      
      if (result.success) {
        setIsOnboardingComplete(false);
      }
      
      return result.success;
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      return false;
    }
  };

  const value: OnboardingContextType = {
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
  };

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