import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingStatus } from '../hooks/useOnboardingStatus';
import { LoadingSpinner } from '../components';

const Stack = createStackNavigator();

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingStatus();

  if (isLoading) {
    return <LoadingSpinner size={40} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Prevent going back during onboarding
        }}
      >
        {isOnboardingComplete ? (
          <Stack.Screen 
            name="Main" 
            component={MainTabNavigator}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
        ) : (
          <Stack.Screen 
            name="Onboarding" 
            component={OnboardingNavigator}
            options={{
              animationTypeForReplace: 'push',
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};