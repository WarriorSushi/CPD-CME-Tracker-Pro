import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';
import { getColor } from '../../theme';

type PrivacyScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Privacy'>;

interface Props {
  navigation: PrivacyScreenNavigationProp;
}

export const PrivacyScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const handleContinue = () => {
    navigation.navigate('Profession');
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔒</Text>
          <Text style={styles.title}>Your Privacy is Our Priority</Text>
          <Text style={styles.description}>
            Built to protect your professional information
          </Text>
        </View>

        <View style={styles.featuresGrid}>
          <Card style={styles.featureCard}>
            <Text style={styles.featureIcon}>📱</Text>
            <Text style={styles.featureTitle}>100% Offline</Text>
            <Text style={styles.featureDescription}>Data never leaves your device</Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureIcon}>🚫</Text>
            <Text style={styles.featureTitle}>No Collection</Text>
            <Text style={styles.featureDescription}>We don't collect your data</Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureIcon}>🔐</Text>
            <Text style={styles.featureTitle}>Encrypted</Text>
            <Text style={styles.featureDescription}>Sensitive data is encrypted</Text>
          </Card>

          <Card style={styles.featureCard}>
            <Text style={styles.featureIcon}>👤</Text>
            <Text style={styles.featureTitle}>You Control</Text>
            <Text style={styles.featureDescription}>Export or delete anytime</Text>
          </Card>
        </View>

        <View style={styles.assurance}>
          <Text style={styles.assuranceText}>
            🏥 Built specifically for healthcare professionals who value privacy and compliance
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="I Understand - Let's Begin"
          onPress={handleContinue}
          style={styles.primaryButton}
        />
        
        <Button
          title="Back"
          variant="outline"
          onPress={handleBack}
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
  icon: {
    fontSize: 48,
    marginBottom: theme.spacing[3],
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  description: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[6],
  },
  featureCard: {
    width: '48%',
    marginBottom: theme.spacing[4],
    alignItems: 'center',
    paddingVertical: theme.spacing[4],
    paddingHorizontal: theme.spacing[3],
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: theme.spacing[2],
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[2],
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  assurance: {
    backgroundColor: getColor('selectedBg'),
    borderRadius: theme.borderRadius.medium,
    padding: theme.spacing[4],
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  assuranceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
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
    // Secondary button styles
  },
});