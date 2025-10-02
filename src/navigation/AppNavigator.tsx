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
    backgroundColor: theme.colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[6],
  },
  loadingTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginTop: theme.spacing[4],
    marginBottom: theme.spacing[2],
  },
  loadingSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});