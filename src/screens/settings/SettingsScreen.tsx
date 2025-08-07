import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Button } from '../../components';
import { theme } from '../../constants/theme';
import { useOnboardingStatus } from '../../hooks';

export const SettingsScreen: React.FC = () => {
  const { resetOnboarding } = useOnboardingStatus();

  const handleResetOnboarding = async () => {
    await resetOnboarding();
    // This will trigger the navigation to switch back to onboarding
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Development</Text>
          <Button
            title="Reset Onboarding"
            variant="outline"
            onPress={handleResetOnboarding}
            style={styles.resetButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing[5],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[8],
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
  },
  resetButton: {
    // Reset button styles
  },
});