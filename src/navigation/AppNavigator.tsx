import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { LoadingSpinner } from '../components';

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingContext();

  console.log('🧭 AppNavigator render - isLoading:', isLoading, 'isOnboardingComplete:', isOnboardingComplete);

  if (isLoading) {
    console.log('⏳ Showing loading spinner');
    return <LoadingSpinner size={40} />;
  }

  console.log('🎯 Rendering:', isOnboardingComplete ? 'MainTabNavigator' : 'OnboardingNavigator');

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