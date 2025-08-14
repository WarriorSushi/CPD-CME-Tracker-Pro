import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/theme';
import { AppNavigator } from './src/navigation';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { AppProvider } from './src/contexts/AppContext';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';

export default function App() {
  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AppProvider>
          <ThemeProvider>
            <StatusBar style="auto" />
            <AppNavigator />
            <OfflineIndicator />
          </ThemeProvider>
        </AppProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
