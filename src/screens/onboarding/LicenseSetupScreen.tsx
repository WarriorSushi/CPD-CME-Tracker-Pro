import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card, ProgressIndicator } from '../../components';
import { FloatingLicenseModal } from '../../components/onboarding/FloatingLicenseModal';
import { theme } from '../../constants/theme';
import { tokens } from '../../theme/tokens';
import { OnboardingStackParamList } from '../../types/navigation';

type LicenseSetupScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'LicenseSetup'>;

interface Props {
  navigation: LicenseSetupScreenNavigationProp;
}

export const LicenseSetupScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [skipForNow, setSkipForNow] = useState(false);
  const [showLicenseForm, setShowLicenseForm] = useState(false);

  const handleAddLicenses = useCallback(() => {

    // Small delay to ensure stable state
    setTimeout(() => {
      setShowLicenseForm(true);

    }, 100);
  }, [showLicenseForm]);

  const handleLicenseModalClose = useCallback(() => {

    setShowLicenseForm(false);
  }, []);

  const handleLicenseModalSuccess = () => {
    navigation.navigate('SetupComplete');
  };

  const handleSkipForNow = () => {
    setSkipForNow(true);
    
    navigation.navigate('SetupComplete');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <ProgressIndicator currentStep={5} totalSteps={6} />
          
          <View style={styles.header}>
            <Text style={styles.title}>License Management</Text>
            <Text style={styles.subtitle}>Stay on top of your license renewals</Text>
            
            {/* Privacy-friendly guidance */}
            <View style={styles.privacyTip}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <View style={styles.privacyTextContainer}>
                <Text style={styles.privacyText}>
                  <Text style={styles.privacyBold}>Pro tip:</Text> Just use license types like "RN License" or "Medical License" instead of license numbers. 
                  This keeps your information private while still tracking renewals!
                </Text>
              </View>
            </View>
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
      
      {/* Floating License Modal - MOVED OUTSIDE main container */}
      <FloatingLicenseModal
        visible={showLicenseForm}
        onClose={handleLicenseModalClose}
        onSuccess={handleLicenseModalSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing[3],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  privacyTip: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[2],
    marginTop: theme.spacing[2],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  privacyIcon: {
    fontSize: 14,
    marginRight: theme.spacing[2],
  },
  privacyTextContainer: {
    flex: 1,
  },
  privacyText: {
    fontSize: 11,
    color: theme.colors.text.primary,
    lineHeight: 14,
  },
  privacyBold: {
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
  },
  optionsContainer: {
    marginBottom: theme.spacing[4],
  },
  modernOption: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.medium,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[3],
    marginBottom: theme.spacing[2],
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: tokens.color.selectedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing[2],
  },
  optionIcon: {
    fontSize: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 10,
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
    padding: theme.spacing[3],
    paddingTop: theme.spacing[2],
  },
  backButton: {
    // Back button styles
  },
});