import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { LoadingSpinner } from '../components';

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingStatus();

  console.log('🧭 AppNavigator render - isLoading:', isLoading, 'isOnboardingComplete:', isOnboardingComplete);

  if (isLoading) {
    console.log('⏳ Showing loading spinner');
    return <LoadingSpinner size={40} />;
  }

  console.log('🎯 Rendering:', isOnboardingComplete ? 'MainTabNavigator' : 'OnboardingNavigator');

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