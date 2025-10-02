import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingNavigator } from './OnboardingNavigator';
import { MainTabNavigator } from './MainTabNavigator';
import { useOnboardingContext } from '../contexts/OnboardingContext';
import { useAppContext } from '../contexts/AppContext';
import { LoadingSpinner } from '../components';
import { AnimatedGradientBackground } from '../components/common/OnboardingComponents';
import { useNavigationSounds } from '../hooks/useNavigationSounds';
import { theme } from '../constants/theme';

// Enhanced loading screen component
const AppLoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <AnimatedGradientBackground />
      <View style={styles.loadingContent}>
        <LoadingSpinner size={50} />
        <Text style={styles.loadingTitle}>CME Tracker</Text>
        <Text style={styles.loadingSubtitle}>Setting up your workspace...</Text>
      </View>
    </View>
  );
};

export const AppNavigator: React.FC = () => {
  const { isOnboardingComplete, isLoading } = useOnboardingContext();
  const { isInitializing } = useAppContext();

  if (isLoading || isInitializing) {
    return <AppLoadingScreen />;
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

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFBFC', // theme.colors.background - hardcoded to avoid load-time issues
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // theme.spacing[6]
  },
  loadingTitle: {
    fontSize: 20, // theme.typography.fontSize.xl
    fontWeight: '700', // theme.typography.fontWeight.bold
    color: '#111827', // theme.colors.text.primary
    marginTop: 16, // theme.spacing[4]
    marginBottom: 8, // theme.spacing[2]
  },
  loadingSubtitle: {
    fontSize: 16, // theme.typography.fontSize.base
    color: '#6B7280', // theme.colors.text.secondary
    textAlign: 'center',
    fontStyle: 'italic',
  },
});