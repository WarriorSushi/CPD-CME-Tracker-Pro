import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { AppProvider } from './src/contexts/AppContext';
import { OfflineIndicator } from './src/components/common/OfflineIndicator';
import { globalErrorHandler } from './src/utils/GlobalErrorHandler';

export default function App() {
  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.initialize();

    // Add error logging (optional - for debugging)
    const removeErrorHandler = globalErrorHandler.addErrorHandler((errorInfo) => {
      if (__DEV__) {
        console.log(`🔍 Error tracked: ${errorInfo.source} - Count: ${errorInfo.count}`);
      }
    });

    return removeErrorHandler;
  }, []);

  return (
    <SafeAreaProvider>
      <OnboardingProvider>
        <AppProvider>
          <StatusBar style="auto" />
          <AppNavigator />
          <OfflineIndicator />
        </AppProvider>
      </OnboardingProvider>
    </SafeAreaProvider>
  );
}
