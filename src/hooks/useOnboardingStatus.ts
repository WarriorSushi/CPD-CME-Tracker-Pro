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
      console.log('🔄 Setting onboarding completion flag...');
      const result = await settingsOperations.setSetting(
        STORAGE_KEYS.ONBOARDING_COMPLETED, 
        'true'
      );
      console.log('📊 Database setSetting result:', result);
      
      if (result.success) {
        console.log('✨ Setting state isOnboardingComplete to true');
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

  return {
    isOnboardingComplete,
    isLoading,
    completeOnboarding,
    resetOnboarding,
    checkOnboardingStatus,
  };
};