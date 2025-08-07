import { useState, useEffect } from 'react';
import { settingsOperations } from '../services/database';
import { STORAGE_KEYS } from '../constants';

export const useOnboardingStatus = () => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const result = await settingsOperations.getSetting(STORAGE_KEYS.ONBOARDING_COMPLETED);
      
      if (result.success && result.data) {
        setIsOnboardingComplete(result.data === 'true');
      } else {
        // If setting doesn't exist, onboarding is not complete
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
      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'true'
      );
      
      if (result.success) {
        setIsOnboardingComplete(true);
      }
      
      return result.success;
    } catch (error) {
      console.error('Error completing onboarding:', error);
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

  return {
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
  };
};