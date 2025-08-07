import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { theme } from '../constants/theme';
import { OnboardingStackParamList } from '../types/navigation';

// Import screens (we'll create these next)
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { FeaturesScreen } from '../screens/onboarding/FeaturesScreen';
import { PrivacyScreen } from '../screens/onboarding/PrivacyScreen';
import { ProfessionScreen } from '../screens/onboarding/ProfessionScreen';
import { CountryScreen } from '../screens/onboarding/CountryScreen';
import { CreditSystemScreen } from '../screens/onboarding/CreditSystemScreen';
import { AnnualTargetScreen } from '../screens/onboarding/AnnualTargetScreen';
import { LicenseSetupScreen } from '../screens/onboarding/LicenseSetupScreen';
import { SetupCompleteScreen } from '../screens/onboarding/SetupCompleteScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        cardStyle: { 
          backgroundColor: theme.colors.background 
        },
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          animationTypeForReplace: 'push',
        }}
      />
      <Stack.Screen 
        name="Features" 
        component={FeaturesScreen}
      />
      <Stack.Screen 
        name="Privacy" 
        component={PrivacyScreen}
      />
      <Stack.Screen 
        name="Profession" 
        component={ProfessionScreen}
      />
      <Stack.Screen 
        name="Country" 
        component={CountryScreen}
      />
      <Stack.Screen 
        name="CreditSystem" 
        component={CreditSystemScreen}
      />
      <Stack.Screen 
        name="AnnualTarget" 
        component={AnnualTargetScreen}
      />
      <Stack.Screen 
        name="LicenseSetup" 
        component={LicenseSetupScreen}
      />
      <Stack.Screen 
        name="SetupComplete" 
        component={SetupCompleteScreen}
      />
    </Stack.Navigator>
  );
};