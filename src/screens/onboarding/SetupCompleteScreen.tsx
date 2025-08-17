import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { useOnboardingContext } from '../../contexts/OnboardingContext';

type SetupCompleteScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'SetupComplete'>;

interface Props {
  navigation: SetupCompleteScreenNavigationProp;
}

export const SetupCompleteScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(false);
  const { completeOnboarding } = useOnboardingContext();

  const handleStartUsingApp = async () => {

    setIsLoading(true);
    
    try {

      const success = await completeOnboarding();

      if (success) {

        // Force a small delay to ensure state propagation
        setTimeout(() => {

          // This should trigger any listeners to recheck the state
        }, 200);
        // Navigation will automatically switch to main app due to the navigation logic
        // in AppNavigator based on onboarding status
      } else {
      __DEV__ && console.error('❌ Failed to complete onboarding');
      }
    } catch (error) {
      __DEV__ && console.error('💥 Error completing onboarding:', error);
    } finally {
      setIsLoading(false);

    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Your CPD & CME Tracker is now configured and ready to help you stay compliant with your continuing education requirements.
        </Text>
        
        <View style={styles.nextSteps}>
          <Text style={styles.nextStepsTitle}>What's next?</Text>
          <Text style={styles.nextStepsItem}>• Start tracking your CME activities</Text>
          <Text style={styles.nextStepsItem}>• Scan and store your certificates</Text>
          <Text style={styles.nextStepsItem}>• Set up license renewal reminders</Text>
          <Text style={styles.nextStepsItem}>• Monitor your progress toward annual goals</Text>
        </View>
      </View>
      
      <View style={styles.actions}>
        <Button
          title="Start Using CPD & CME Tracker"
          onPress={handleStartUsingApp}
          loading={isLoading}
          style={styles.primaryButton}
        />
        
        <Button
          title="Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.secondaryButton}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[5],
  },
  icon: {
    fontSize: 64,
    marginBottom: theme.spacing[4],
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing[8],
  },
  nextSteps: {
    alignSelf: 'stretch',
  },
  nextStepsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[4],
    textAlign: 'center',
  },
  nextStepsItem: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing[2],
    lineHeight: 22,
  },
  actions: {
    padding: theme.spacing[5],
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
  secondaryButton: {
    // Secondary button styles
  },
});