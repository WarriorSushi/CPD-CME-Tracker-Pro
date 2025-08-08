import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { getColor } from '../../theme';

type LicenseSetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'LicenseSetup'>;

interface Props {
  navigation: LicenseSetupScreenNavigationProp;
}

export const LicenseSetupScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [skipForNow, setSkipForNow] = useState(false);
  const [showLicenseForm, setShowLicenseForm] = useState(false);

  const handleAddLicenses = () => {
    // TODO: In a real implementation, this would show a license entry form
    // For now, we'll go to SetupComplete but note that they wanted to add licenses
    console.log('User chose to add licenses - would show license form here');
    navigation.navigate('SetupComplete');
  };

  const handleSkipForNow = () => {
    setSkipForNow(true);
    // TODO: Save that user skipped license setup
    navigation.navigate('SetupComplete');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>License Management</Text>
          <Text style={styles.subtitle}>Stay on top of your license renewals</Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.modernOption}
            onPress={handleAddLicenses}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.optionIcon}>🏅</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Add My Licenses</Text>
                <Text style={styles.optionDescription}>Set up renewal tracking</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.modernOption}
            onPress={handleSkipForNow}
          >
            <View style={styles.optionLeft}>
              <View style={styles.iconContainer}>
                <Text style={styles.optionIcon}>⏭️</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Skip for Now</Text>
                <Text style={styles.optionDescription}>Add later in settings</Text>
              </View>
            </View>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.benefitsList}>
          <Text style={styles.benefitsTitle}>Why track licenses?</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>•</Text>
            <Text style={styles.benefitText}>Automatic renewal reminders</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>•</Text>
            <Text style={styles.benefitText}>Track CE requirements per license</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>•</Text>
            <Text style={styles.benefitText}>Never miss critical deadlines</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
          style={styles.backButton}
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
    marginBottom: theme.spacing[8],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: theme.spacing[8],
  },
  modernOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: getColor('selectedBg'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[3],
  },
  optionIcon: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  optionDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  arrow: {
    fontSize: 24,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  benefitsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[4],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.secondary,
  },
  benefitsTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[3],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[2],
  },
  benefitIcon: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.secondary,
    marginRight: theme.spacing[2],
    marginTop: 2,
  },
  benefitText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: theme.spacing[3],
  },
  backButton: {
    // Back button styles
  },
});