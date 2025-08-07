import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { LoadingSpinner } from '../components';

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingStatus();

  if (isLoading) {
    return <LoadingSpinner size={40} />;
  }

  return (
    <NavigationContainer>
      {isOnboardingComplete ? (
        <MainTabNavigator />
      ) : (
        <OnboardingNavigator />
      )}
    </NavigationContainer>
  );
};