import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { theme } from '../../constants/theme';
import { OnboardingStackParamList } from '../../types/navigation';

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.icon}>🔒</Text>
            <Text style={styles.title}>Your Privacy is</Text>
            <Text style={styles.subtitle}>Our Priority</Text>
            <Text style={styles.description}>
              Built from the ground up to protect your professional information
            </Text>
          </View>

          <Card style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyIcon}>📱</Text>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>100% Offline</Text>
                <Text style={styles.privacyDescription}>
                  No internet connection required. Ever. Your data never leaves your device.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyIcon}>🚫</Text>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>No Data Collection</Text>
                <Text style={styles.privacyDescription}>
                  We don't collect, store, or transmit any of your personal or professional information.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyIcon}>🔐</Text>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>Encrypted Storage</Text>
                <Text style={styles.privacyDescription}>
                  All sensitive data like license numbers are encrypted and stored securely on your device.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.privacyCard}>
            <View style={styles.privacyItem}>
              <Text style={styles.privacyIcon}>👤</Text>
              <View style={styles.privacyContent}>
                <Text style={styles.privacyTitle}>You're in Control</Text>
                <Text style={styles.privacyDescription}>
                  Export your data anytime. Delete it anytime. No accounts, no cloud sync, no third parties.
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.assuranceCard}>
            <Text style={styles.assuranceTitle}>Why This Matters</Text>
            <Text style={styles.assuranceText}>
              As a healthcare professional, your continuing education records contain sensitive professional information. 
              {'\n\n'}
              With CME Tracker, you maintain complete control over your data while staying compliant with your professional requirements.
            </Text>
          </Card>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing[5],
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing[8],
    marginTop: theme.spacing[3],
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
  },
  subtitle: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing[3],
  },
  description: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  privacyCard: {
    marginBottom: theme.spacing[3],
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  privacyIcon: {
    fontSize: 24,
    marginRight: theme.spacing[4],
    marginTop: theme.spacing[1],
  },
  privacyContent: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing[1],
  },
  privacyDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight: 22,
  },
  assuranceCard: {
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing[4],
  },
  assuranceTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.white,
    marginBottom: theme.spacing[3],
    textAlign: 'center',
  },
  assuranceText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.white,
    lineHeight: 22,
    textAlign: 'center',
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