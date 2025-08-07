import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type LicenseSetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'LicenseSetup'>;

interface Props {
  navigation: LicenseSetupScreenNavigationProp;
}

export const LicenseSetupScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [skipForNow, setSkipForNow] = useState(false);

  const handleContinue = () => {
    // TODO: Save license setup preference to onboarding data
    navigation.navigate('SetupComplete');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddLater = () => {
    setSkipForNow(true);
    handleContinue();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>License Setup</Text>
          <Text style={styles.subtitle}>Track your professional licenses and renewal dates</Text>
        </View>

        <View style={styles.optionsContainer}>
          <Card style={styles.optionCard}>
            <Text style={styles.optionIcon}>📋</Text>
            <Text style={styles.optionTitle}>Set Up Licenses Now</Text>
            <Text style={styles.optionDescription}>
              Add your professional licenses and renewal dates to get automatic reminders
            </Text>
          </Card>

          <Card style={styles.optionCard}>
            <Text style={styles.optionIcon}>⏭️</Text>
            <Text style={styles.optionTitle}>Skip for Now</Text>
            <Text style={styles.optionDescription}>
              You can add your licenses later from the settings menu
            </Text>
          </Card>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Tip: Adding licenses helps you track renewal requirements and never miss important deadlines
          </Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Set Up Licenses"
          onPress={handleContinue}
          style={styles.primaryButton}
        />
        <Button
          title="Skip for Now"
          variant="outline"
          onPress={handleAddLater}
          style={styles.secondaryButton}
        />
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
        />
      </View>
    </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[6],
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: theme.spacing[6],
  },
  optionCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[4],
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing[3],
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoBox: {
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    lineHeight: 18,
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: theme.spacing[3],
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
  secondaryButton: {
    marginBottom: theme.spacing[3],
  },
});