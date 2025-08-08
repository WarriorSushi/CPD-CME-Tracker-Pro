import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AppNavigator } from './src/navigation';
import { OnboardingProvider } from './src/contexts/OnboardingContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <AppNavigator />
        </ThemeProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
