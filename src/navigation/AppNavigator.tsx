import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { LoadingSpinner } from '../components';

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingContext();

  if (isLoading) {

    return <LoadingSpinner size={40} />;
  }

  // Use key prop to force NavigationContainer remount when onboarding status changes
  // This ensures navigation state is completely reset when switching between navigators
  const navigationKey = isOnboardingComplete ? 'main' : 'onboarding';

  return (
    <NavigationContainer key={navigationKey}>
      {isOnboardingComplete ? (
        <MainTabNavigator />
      ) : (
        <OnboardingNavigator />
      )}
    </NavigationContainer>
  );
};