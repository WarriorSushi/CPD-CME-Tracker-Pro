import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  
  const handleContinue = () => {
    navigation.navigate('Features');
  };

  const handleSkip = () => {
    // For now, we'll go through the full onboarding
    // In a real app, we might check if user already has data
    navigation.navigate('Features');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to</Text>
          <Text style={styles.appName}>CME Tracker</Text>
          <Text style={styles.subtitle}>
            Your secure, offline continuing education companion
          </Text>
        </View>

        <Card style={styles.benefitsCard}>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>100% Private</Text>
              {'\n'}All your data stays on your device
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📱</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Works Offline</Text>
              {'\n'}No internet required, ever
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🎯</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Never Miss Deadlines</Text>
              {'\n'}Smart reminders for renewals
            </Text>
          </View>

          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📄</Text>
            <Text style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Scan Certificates</Text>
              {'\n'}Auto-extract information from photos
            </Text>
          </View>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Built specifically for healthcare professionals
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Get Started"
          onPress={handleContinue}
          style={styles.primaryButton}
        />
        
        <Button
          title="Skip Introduction"
          variant="outline"
          onPress={handleSkip}
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
    padding: theme.spacing[5],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
  },
  title: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    marginBottom: theme.spacing[1],
  },
  appName: {
    fontSize: theme.typography.fontSize.xxxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  benefitsCard: {
    marginBottom: theme.spacing[8],
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing[5],
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: theme.spacing[4],
    marginTop: theme.spacing[1],
  },
  benefitText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  benefitTitle: {
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    padding: theme.spacing[5],
    paddingTop: 0,
  },
  primaryButton: {
    marginBottom: theme.spacing[3],
  },
  secondaryButton: {
    // Secondary button styles
  },
});